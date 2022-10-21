/* !@file DomainDroplist.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function DomainDroplist() {
  this.domainNames_ = [];
  this.domainDroplistListeners_ = [];
  this.defaultDomain_ = 'default-domain';
  this.selectedDomain_ = this.defaultDomain_;
}

DomainDroplist.prototype = {
  constructor: DomainDroplist,
  initDomains: function () {
    const self = this;
    // Call the flask endpoint
    //
    return $.ajax({
      type: 'GET',
      url: 'dlprof/rest/domain_data',
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        const domains = jqXHR;

        for (var ii = 0; ii < domains.length; ii++) {
          var row = domains[ii];
          self.domainNames_.push(row['domain_name']);
        }

        self.fillDomainDroplist();
        self.setDomainDroplistListener();

        self.domainNames_.length > 1
          ? $('.domainSelectionRow').show()
          : $('.domainSelectionRow').hide();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillDomainDroplist: function () {
    // Append sorted domain names in the unordered list
    //
    for (var ii = 0; ii < this.domainNames_.length; ii++) {
      $('#launchDomainList').append(
        '<li><a href="#" class="launchDomain" id="' +
          this.domainNames_[ii] +
          '">' +
          this.domainNames_[ii] +
          '</a></li>'
      );
    }
  },

  selectDomain: function (domainName) {
    // Update button with selected domain
    //
    domainSelectionText = this.getDomainSelectionText(domainName);
    $('#domainDroplist').html(
      domainSelectionText + ' <span class="caret"></span>'
    );
  },

  getDomainSelectionText: function (domainName) {
    const self = this;

    var domain = $.grep(self.domainNames_, function (e) {
      return e == domainName;
    });

    domainSelectionText = '';
    if (domain.length !== 0) {
      domainSelectionText = domain[0];
    }

    return domainSelectionText;
  },

  addDomainDroplistListener(listener) {
    this.domainDroplistListeners_.push(listener);
  },

  setDomainDroplistListener: function () {
    const self = this;

    $('.launchDomain')
      .unbind()
      .click(function (e) {
        $('#invalid-url-arguments-panel').hide();

        // Get the selected domain from click event
        //
        const selectedDomainName = $(e.currentTarget).text();
        localStorage.setItem(Globals.SELECTED_DOMAIN_KEY, selectedDomainName);
        self.selectDomain(selectedDomainName);

        // Update browser's URL with new aggregation selection
        //
        var str = window.location.search;
        str = replaceQueryParam(
          Globals.SELECTED_DOMAIN_URL,
          selectedDomainName,
          str
        );
        history.replaceState({}, '', window.location.pathname + str);

        // Load iteration parameters based on aggregation/domain keys
        //
        Globals.init(
          localStorage.getItem(Globals.SELECTED_AGGREGATION_KEY),
          localStorage.getItem(Globals.SELECTED_DOMAIN_KEY)
        );

        // Call the view listener so the view can updates its visualization
        //
        for (var listener of self.domainDroplistListeners_) {
          listener.droplistListener(
            e,
            localStorage.getItem(Globals.SELECTED_AGGREGATION_KEY),
            localStorage.getItem(Globals.SELECTED_DOMAIN_KEY)
          );
        }
      });
  },

  validateDomain: function (scope, domainName) {
    isValid = true;

    domainSelectionText = scope.getDomainSelectionText(domainName);
    if (domainSelectionText.length === 0) {
      isValid = false;
    }

    return isValid;
  },

  getDefaultDomainSelection: function () {
    return this.defaultDomain_;
  },
};
