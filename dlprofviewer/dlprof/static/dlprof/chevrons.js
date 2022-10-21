/*!@file chevrons.js
 *
 * Copyright (c) 2019-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function loadChevronEvents(
  chevronID,
  selectorToSlide,
  toggler,
  functionToCallOnOpen
) {
  toggler = toggler === 'true';

  // remove all existing event handles on this selector
  $(chevronID).off();

  $(chevronID)
    .unbind()
    .on('click', function (e) {
      toggler = !toggler;
      slidePanel(chevronID, selectorToSlide, toggler, functionToCallOnOpen);
    });
}

function slidePanel(chevronID, selectorToSlide, toggler, functionToCallOnOpen) {
  if (toggler) {
    // when true: Hide the panel and show right chevron
    $(selectorToSlide).slideUp('slow');
    $(chevronID).html(
      '<i class="fa fa-expand" title="Expand panel" style="cursor: pointer"></i>'
    );
  } else {
    // when false: Show the panel and show down chevron
    $(selectorToSlide).slideDown('slow', function () {
      if (functionToCallOnOpen != null) {
        functionToCallOnOpen();
      }
    });

    $(chevronID).html(
      '<i class="fa fa-compress" title="Compress panel" style="cursor: pointer"></i>'
    );
  }
}
