"use strict";

/**
 * Represents a nav item in the TOC, used to update current/active status.
 */
class NavItem {
  /**
   * @param {Element} element - The list-item associated with this NavItem.
   * @param {NavItem} [parent=null] - The parent of this NavItem if it has one, based on DOM structure.
   * @param {boolean} [isIntersecting=false] - Is this NavItem currently intersecting with an {@link IntersectionObserver}?
   */
  constructor(element, parent = null, isIntersecting = false) {
    this.element = element;
    this.parent = parent;
    this.isIntersecting = isIntersecting;
    this.href = element.querySelector(":scope > a").getAttribute("href");
  }

  update() {
    this.element.classList.toggle("current", this.isIntersecting);
    // console.log(`${this.href} updated, isIntersecting=${this.isIntersecting}`)
  }

  activate(calledFromChild = false) {
    this.element.classList.add("current");
    // console.log(`${this.href} activated, calledFromChild=${calledFromChild}`)

    if (!calledFromChild) {
      this.isIntersecting = true;
    }
    this.parent?.deactivate(true);
  }

  deactivate(calledFromChild = false) {
    this.element.classList.remove("current");
    // console.log(`${this.href} deactivated, calledFromChild=${calledFromChild}`)

    if (!calledFromChild) {
      this.isIntersecting = false;
      this.parent?.update();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const model = {};
  const tocRootItems = [...document.querySelectorAll(".toc nav > ul > li")];

  // Populate model with each of the level 1 items in the TOC list
  tocRootItems.forEach((item) => {
    let navItem = new NavItem(item);
    model[navItem.href] = navItem;

    // Add any children to the model with a reference back to the parent item so
    // the children can deactivate their parents on intersection.
    let children = item.querySelectorAll(":scope > ul li");
    children.forEach((child) => {
      let c = new NavItem(child, navItem);
      model[c.href] = c;
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

      if (!entry.isIntersecting) {
        spy.deactivate();
        return;
      }
      spy.activate();
    });
  };

  /** @type {IntersectionObserver} */
  const observer = new IntersectionObserver(spyItem, {
    rootMargin: "-10% 0% -90% 0%"
  });
  /** @type {Element[]} */
  const sections = [...document.querySelectorAll("section")];

  sections.forEach((section) => observer.observe(section));
});
