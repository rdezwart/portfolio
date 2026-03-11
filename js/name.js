// This script is for use with the "fancyName" PUG mixin, which has to be a child of a ".name-wrapper"

"use strict";

$(function () {
  // Grab our elements
  let name = $(".name[data-fancy]");
  let link = name.find(".link");
  let nameWrapper = name.parent(".name-wrapper")
  let letters = link.find(".letters").children();

  // Letter array is left-to-right, we also want right-to-left for hiding animation
  // Referenced: https://www.sitepoint.com/jquery-each-reverse-it/
  let reversed = $(letters.get().reverse());

  // Animation timings
  let letterDelay = 15;
  let animDuration = 200;

  // Hide the last name when the document opens
  letters.each(function () {
    $(this).hide();
  });

  // NOTE: Moving references outside methods to keep things readable.
  // Clearing animation queue, referenced: https://stackoverflow.com/a/3701890 https://api.jquery.com/stop/
  // Settled on finish() instead of stop(), referenced: https://api.jquery.com/finish/
  // Delay on an each() loop, referenced: https://stackoverflow.com/a/35800471
  // Events for listener, referenced: https://api.jquery.com/category/events/

  // When the name LINK is hovered/focused
  link.on("mouseenter focusin", function () {
    letters.each(function (index) {
      $(this).finish().delay(letterDelay * index).fadeIn(animDuration);
    });
  });

  // When the name WRAPPER stops being hovered/focused (this prevents animation spam as document shifts)
  nameWrapper.on("mouseleave focusout", function () {
    reversed.each(function (index) {
      $(this).finish().delay(letterDelay * index).fadeOut(animDuration);
    });
  });
});
