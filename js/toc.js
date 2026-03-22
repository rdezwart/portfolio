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
  const model = {};
  const tocRootItems = [...document.querySelectorAll(".toc nav > ol > li")];

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


  /**
   * Callback function for {@link IntersectionObserver}.
   * @param {IntersectionObserverEntry[]} entries
   */
  const spyItem = (entries) => {
    entries.forEach((entry) => {
      const {id} = entry.target;
      const spy = model[`#${id}`];
      entry.isIntersecting ? spy.activate() : spy.deactivate();
    });
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
