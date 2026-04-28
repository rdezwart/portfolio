"use strict";

/**
 * Represents a nav item in the TOC, used to update current/active status.
 */
class NavItem {
  /**
   * @param {Element} element - The list-item associated with this NavItem.
   * @param {NavItem} [parent=null] - The parent of this NavItem if it has one, based on DOM structure.
   * @param {NavItem[]} [children=[]] - The children of this NavItem if it has any, based on DOM structure.
   * @param {boolean} [isIntersecting=false] - Is this NavItem currently intersecting with an {@link IntersectionObserver}?
   */
  constructor(element, parent = null, children = [], isIntersecting = false) {
    this.element = element;
    this.parent = parent;
    this.children = children;
    this.isIntersecting = isIntersecting;
    this.href = element.querySelector(":scope > a").getAttribute("href");
  }

  /**
   * Callback function to see if a child `NavItem` is currently intersecting
   * with an observer. For use with {@link Array.some()}.
   * @param {NavItem} child - The child to check.
   * @returns {boolean} - If this child is intersecting with an observer.
   */
  #childrenActive = (child) => child.isIntersecting;

  /**
   * Adds or removes the `current` class based on currently active children and
   * if this item is intersecting with an observer.
   */
  update() {
    let someChildrenActive = this.children.some(this.#childrenActive);
    let visuallyActive = this.isIntersecting && !someChildrenActive;
    this.element.classList.toggle("current", visuallyActive);
  }

  /**
   * Manually adds the `current` class and marks this item as intersecting with
   * an observer.
   *
   * Also triggers {@link update()} on this item's parent, if it has one.
   */
  activate() {
    this.element.classList.add("current");
    this.isIntersecting = true;
    this.parent?.update();
  }

  /**
   * Manually removes the `current` class and marks this item as not
   * intersecting with an observer.
   *
   * Also triggers `update()` on this item's parent, if it has one.
   */
  deactivate() {
    this.element.classList.remove("current");
    this.isIntersecting = false;
    this.parent?.update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  /** @type {Object.<string, NavItem>} */
  const model = {};
  /** @type {Element[]} */
  const tocRootItems = [...document.querySelectorAll(".toc nav > ol > li")];
  let firstLoad = true;
  let overviewChecked = false;
  const overview = document.getElementById("overview");

  /**
   * Helper function to make sure the values are always fresh.
   * @return {number}
   */
  let overviewTop = () => overview.getBoundingClientRect().top;

  // Populate model with each of the level 1 items in the TOC list
  tocRootItems.forEach((item) => {
    let navItem = new NavItem(item);
    model[navItem.href] = navItem;

    // Add any children to the model with links to and from their parent item so
    // the children can update their parents on intersection.
    let children = item.querySelectorAll(":scope > ol li");
    children.forEach((child) => {
      let c = new NavItem(child, navItem);
      model[c.href] = c;
      navItem.children.push(c);
    });
  });

  /** @type {NavItem} */
  let overviewItem = model["#overview"];


  /**
   *
   * @param {IntersectionObserverEntry} entry
   */
  function checkOverview(entry) {
    /*
     * We want Overview to have `.current` on page load, but if we reload while
     * scrolled lower down the page, there are a number of edge cases we need to
     * take care of.
     *
     * We only want Overview to be activated if it is currently intersecting, or
     * if we are scrolled above it. This is easy to handle by getting it to
     * check its own position and responding appropriately. See `Case 1`.
     *
     * However, sometimes the scroll event happens before the observers fire off
     * their first callback (on the first render cycle), and sometimes after.
     * This seems to be based on the order scripts finish loading and is not
     * consistent.
     *
     * If the scroll fires after the callback, then Overview thinks it's allowed
     * to activate itself, before the page scrolls down to where it's supposed
     * to be, incorrectly leaving Overview active.
     *
     * These mostly happen
     * 1. Get Overview to check itself
     */


    const {id} = entry.target;

    /* Case 1 */
    if (id === "overview") {
      console.log("Overview: checking itself", overviewTop())

      if (overviewTop() <= 0) {
        if (!overviewChecked) {
          // Overview correctly realizes it's below the top of the screen
          overviewChecked = true;
          if (entry.isIntersecting) {
            // It's allowed to stay active
            console.log("Overview: wanted to deactivate, but was intersecting");
          } else {
            // It should deactivate itself
            overviewItem.deactivate();
            console.warn("Overview: deactivated itself");
          }
        } else {
          console.log("Overview: was already checked");
        }
      }
    }

    /*
     * CASE 2: After the first callback containing all entries, the page will
     * scroll down and trigger an intersection on the newly visible section.
     */
    if (!firstLoad) {
      if (!overviewChecked) {
        console.log(`Entries: ${id} is checking overview`, overviewTop());

        // If the first intersection after the load is Overview
        if (id === "overview") {
          console.log("CHECKING ITSELF");
          overviewChecked = true;
        } else {
          if (overviewTop() <= 0) {
            overviewItem.deactivate();
            console.warn(`Entries: ${id} deactivated overview`);
            overviewChecked = true;
          } else {
            console.log(`Entries: ${id} thinks overview seems fine`);
          }
        }
      } else {
        console.log(`Entries: ${id} thinks overview was already checked`);
      }
    }
  }


  /**
   * Callback function for {@link IntersectionObserver}.
   * @param {IntersectionObserverEntry[]} entries
   */
  const spyItem = (entries) => {
    // During the first render cycle after starting observation, all entries
    // get a callback.
    entries.forEach((entry) => {
      const {id} = entry.target;
      const spy = model[`#${id}`];
      entry.isIntersecting ? spy.activate() : spy.deactivate();

      // If top is positive, we are scrolled above the top of Overview
      if (id === "overview" && overviewTop() > 0) {
        overviewItem.activate();
        console.log("Overview: above zero, activated itself");
      }

      if (!overviewChecked) {
        checkOverview(entry);
      }
    });

    //
    // /*
    //  * CASE 3: If the first two cases fail to determine if Overview is in the
    //  * correct state, this is our final measure.
    //  *
    //  * Cases 1 and 2 catch pretty much everything, but I have had this case
    //  * reached a few times, though I'm unable to consistently reproduce it.
    //  */
    // console.log("Post entries: checking overview", overviewTop());
    // if (!overviewChecked) {
    //   if (overviewTop() <= 0) {
    //     model["#overview"].deactivate();
    //     console.warn("Post entries: deactivated overview");
    //     overviewChecked = true;
    //   } else {
    //     console.log("Post entries: overview seems fine");
    //   }
    // } else {
    //   console.log("Post entries: overview was already checked");
    // }


    if (firstLoad) {
      firstLoad = false;
      console.info("FIRST LOAD IS DONE");
    }
  };

  /** @type {IntersectionObserver} */
  const observer = new IntersectionObserver(spyItem, {
    rootMargin: "-10% 0% -90% 0%"
  });
  /** @type {Element[]} */
  const sections = [...document.querySelectorAll(
    ".content > section, .content > section > section")
  ];

  sections.forEach((section) => observer.observe(section));
});
