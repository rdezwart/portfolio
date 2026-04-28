"use strict";

/**
 * Represents a nav item in the TOC, used to update current/active status.
 */
class NavItem {
  /**
   * @param {Element} element - The list-item associated with this NavItem.
   * @param {?NavItem} [parent=null] - The parent of this NavItem if it has one,
   *     based on DOM structure.
   * @param {NavItem[]} [children=[]] - The children of this NavItem if it has
   *     any, based on DOM structure.
   * @param {boolean} [isIntersecting=false] - Is this NavItem currently
   *     intersecting with an {@link IntersectionObserver}?
   */
  constructor(
    element,
    parent = null,
    children = [],
    isIntersecting = false
  ) {
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

/**
 * Returns an object modelling the links between the IDs of DOM sections and
 * paired [NavItems]{@linkcode NavItem}.
 *
 * Automatically handles one level of sub-lists, so only need to pass in the
 * top-level list items.
 * @param {Element[]} items - The items to populate the model with.
 * @return {Object.<string, NavItem>} - A populated model.
 */
function populateModel(items) {
  /** @type {Object.<string, NavItem>} */
  const _model = {};

  // Populate model with each of the level 1 items in the TOC list
  items.forEach((item) => {
    let navItem = new NavItem(item);
    _model[navItem.href] = navItem;

    // Add any children to the model with links to and from their parent item so
    // the children can update their parents on intersection.
    let children = item.querySelectorAll(":scope > ol li");
    children.forEach((child) => {
      let c = new NavItem(child, navItem);
      _model[c.href] = c;
      navItem.children.push(c);
    });
  });

  return _model;
}


document.addEventListener("DOMContentLoaded", () => {
  /**
   * The top-level list items from the Table of Contents.
   * @type {Element[]}
   */
  const tocRootItems = [...document.querySelectorAll(
    ".toc nav > :is(ol, ul) > li"
  )];
  /**
   * Object modelling the links between section IDs and [NavItems]{@linkcode
   * NavItem}.
   * @type {Object.<string, NavItem>}
   */
  const model = populateModel(tocRootItems);

  /**
   * Is this the first time the {@linkcode IntersectionObserver} callback
   * {@linkcode spyItem} has been triggered?
   * @type {boolean}
   */
  let firstLoad = true;
  /**
   * Has Overview been successfully verified to be in the correct state?
   * @type {boolean}
   */
  let wasOverviewVerified = false;

  /** @type {NavItem} */
  let overviewNavItem = model["#overview"];
  /** @type {Element} */
  const overviewElement = document.getElementById("overview");


  /**
   * Helper function to make sure the returned values are always fresh.
   * @return {number} - The `top` value from Overview's {@linkcode DOMRect}.
   */
  function getOverviewTop() {
    return overviewElement.getBoundingClientRect().top;
  }

  /**
   * Verifies if Overview's current state is actually allowed, and
   * [deactivates]{@linkcode NavItem#deactivate} Overview's {@linkcode NavItem}
   * if the state is not valid.
   *
   * ---
   *
   * We want Overview to have `.current` on page load, but if we reload while
   * scrolled lower down the page, things get a bit muddled.
   *
   * Sometimes the Scroll event (to return to the user's previous position on
   * the page) happens *before* the IntersectionObserver fires off its first
   * callback ({@linkcode spyItem}), and sometimes *after*. This seems to
   * be based on the order scripts finish loading and is not consistent.
   *
   * This means that Overview can be confused as to its true position on the
   * page once everything is finished loading, so we need to make a few
   * additional checks:
   *
   * - **CHECK 1:** Overview first checks its own position and responds
   *   appropriately. Initial [activation]{@linkcode NavItem#activate} is
   *   handled in {@linkcode spyItem}.
   * - **CHECK 2:** After the first callback containing all entries, the page
   *   will have scrolled down and triggered an intersection on any newly
   *   visible sections, which will respond appropriately.
   *
   * @param {IntersectionObserverEntry} entry
   * @return {boolean}
   */
  function verifyOverview(entry) {
    const {id} = entry.target;

    /* CHECK 1 */
    if (id === "overview" && getOverviewTop() <= 0) {
      // Overview has correctly realized it's below the top of the screen.
      // It's allowed to stay active if it's actually intersecting.
      if (!entry.isIntersecting) {
        overviewNavItem.deactivate();
      }
      return true;
    }

    /* CHECK 2 */
    if (!firstLoad) {
      // We have to wait until after the first load, so that the only entries
      // passed to the callback are from new intersection changes.
      if (id === "overview") {
        // If the first intersection after the load is Overview, we're scrolling
        // into Overview from above, and it can stay active.
        return true;
      } else if (getOverviewTop() <= 0) {
        // Any other section notices Overview shouldn't be active
        overviewNavItem.deactivate();
        return true;
      }
    }

    return false;
  }


  /**
   * Callback function for {@linkcode IntersectionObserver}.
   *
   * During the first render cycle after starting observation, all `entries` get
   * passed to the callback at once, giving us their initial states.
   *
   * Sometimes this can happen before or after the document scrolls to the
   * user's previous position, so we need to double-check that Overview is
   * allowed to be active on (re)load.
   *
   * @function
   * @param {IntersectionObserverEntry[]} entries
   */
  const spyItem = (entries) => {
    entries.forEach((entry) => {
      const {id} = entry.target;
      const spy = model[`#${id}`];
      entry.isIntersecting ? spy.activate() : spy.deactivate();

      if (overviewElement) {
        // If top is positive, we are scrolled above the top of Overview
        if (id === "overview" && getOverviewTop() > 0) {
          overviewNavItem.activate();
        }

        // Need to make sure Overview is allowed to be active
        if (!wasOverviewVerified) {
          wasOverviewVerified = verifyOverview(entry);
        }
      }
    });

    // Keep track of if this is the first time the callback has been called
    if (firstLoad) firstLoad = false;
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
