/* !@file Navbar.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function Navbar() {}

Navbar.prototype = {
  constructor: Navbar,

  fillDroplists: function (urlAggrID, urlDomainName, callback) {
    const self = this;

    ViewDroplist.fillViewDroplist();

    $.when(
      AggregationDroplist.initAggregations(),
      DomainDroplist.initDomains()
    ).done(function (a1, a2) {
      self.validateDroplistParams(urlAggrID, urlDomainName, callback);
    });
  },

  clearContentPane: function () {
    $('#closeKernelDetailsPanel').click();
  },

  // This gets the specified parameter in this order:
  //  1) from URL parameter
  //  2) from local storage
  //  3) its default value
  // Returns
  //  { the value to use for view, boolean indicating whether or not URL value is valid}
  //
  getValue: function (
    urlValue,
    localStorageKey,
    defaultValue,
    scope,
    validationFunc
  ) {
    var value = defaultValue;
    var isValid = true;
    const djangoEmptyUrlValue = 'None';

    if (urlValue !== djangoEmptyUrlValue) {
      isValid = validationFunc(scope, urlValue);
      if (isValid) {
        value = urlValue;
      }
    } else {
      const storageValue = localStorage.getItem(localStorageKey);

      if (storageValue != null && validationFunc(scope, storageValue)) {
        value = storageValue;
      }
    }

    return {value, isValid};
  },

  validateDroplistParams: function (urlAggrID, urlDomainName, callback) {
    const self = this;

    isLegalDatabase =
      AggregationDroplist.aggregations_.length > 0 &&
      DomainDroplist.domainNames_.length > 0;

    if (!isLegalDatabase) {
      $('#illegal-database-panel').show();
      $('#page-content-wrapper').hide();
    } else {
      const aggregationSelection = this.getValue(
        urlAggrID,
        Globals.SELECTED_AGGREGATION_KEY,
        AggregationDroplist.getDefaultAggregationSelection(),
        AggregationDroplist,
        AggregationDroplist.validateAggregation
      );

      const domainSelection = this.getValue(
        urlDomainName,
        Globals.SELECTED_DOMAIN_KEY,
        DomainDroplist.getDefaultDomainSelection(),
        DomainDroplist,
        DomainDroplist.validateDomain
      );

      self.showWarningPanelsIfNecessary(aggregationSelection, domainSelection);
      self.setLocalMemory(aggregationSelection, domainSelection);
      self.setLocalStorage(aggregationSelection, domainSelection);
      self.setDroplistSelections(aggregationSelection, domainSelection);
      self.setBrowserUrl(aggregationSelection, domainSelection);

      callback(); // Call the view
    }
  },

  showWarningPanelsIfNecessary: function (
    aggregationSelection,
    domainSelection
  ) {
    if (!aggregationSelection.isValid && !domainSelection.isValid) {
      $('#invalid-url-arguments-panel').html(
        '<strong>Warning!</strong> The "' +
          Globals.SELECTED_AGGREGATION_URL +
          '" and "' +
          Globals.SELECTED_DOMAIN_URL +
          '" parameters in your URL are not available for this profile. DLProf is showing your profiled network with default aggregation and domain selections.'
      );
      $('#invalid-url-arguments-panel').show();
    } else if (!aggregationSelection.isValid) {
      $('#invalid-url-arguments-panel').html(
        '<strong>Warning!</strong> The "' +
          Globals.SELECTED_AGGREGATION_URL +
          '" parameter in your URL is not available for this profile. DLProf is showing your profiled network with default aggregation selection.'
      );
      $('#invalid-url-arguments-panel').show();
    } else if (!domainSelection.isValid) {
      $('#invalid-url-arguments-panel').html(
        '<strong>Warning!</strong> The "' +
          Globals.SELECTED_DOMAIN_URL +
          '" parameter in your URL is not available for this profile. DLProf is showing your profiled network with default domain selection.'
      );
      $('#invalid-url-arguments-panel').show();
    }
  },

  setLocalMemory: function (aggregationSelection, domainSelection) {
    const self = this;
    AggregationDroplist.selectedAggregation_ = aggregationSelection.value;
    DomainDroplist.selectedDomain_ = domainSelection.value;
  },

  setLocalStorage: function (aggregationSelection, domainSelection) {
    localStorage.setItem(
      Globals.SELECTED_AGGREGATION_KEY,
      aggregationSelection.value
    );
    localStorage.setItem(Globals.SELECTED_DOMAIN_KEY, domainSelection.value);
  },

  setDroplistSelections: function (aggregationSelection, domainSelection) {
    const self = this;
    AggregationDroplist.selectAggregation(aggregationSelection.value);
    DomainDroplist.selectDomain(domainSelection.value);
  },

  setBrowserUrl: function (aggregationSelection, domainSelection) {
    var str = window.location.search;
    str = replaceQueryParam(
      Globals.SELECTED_AGGREGATION_URL,
      aggregationSelection.value,
      str
    );
    str = replaceQueryParam(
      Globals.SELECTED_DOMAIN_URL,
      domainSelection.value,
      str
    );
    history.replaceState({}, '', window.location.pathname + str);
  },

  addDroplistListener: function (listener) {
    AggregationDroplist.addAggregationDroplistListener(listener);
    DomainDroplist.addDomainDroplistListener(listener);
  },
};
