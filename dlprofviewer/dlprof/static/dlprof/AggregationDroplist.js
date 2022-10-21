/* !@file AggregationDroplist.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function AggregationDroplist() {
  this.aggregations_ = [];
  this.selectedAggregation_;
  this.aggregationDroplistListeners_ = [];
}

AggregationDroplist.prototype = {
  constructor: AggregationDroplist,

  initAggregations: function () {
    const self = this;
    // Call the flask endpoint
    //
    return $.ajax({
      type: 'GET',
      url: 'dlprof/rest/aggregation_data',
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        const aggregations = jqXHR;

        for (var ii = 0; ii < aggregations.length; ii++) {
          const aggr = new Aggregation();
          aggr.initAggregation(aggregations[ii]);
          self.aggregations_.push(aggr);
        }

        self.fillAggregationDroplist();
        self.setAggregationDroplistListener();

        // Show or Hide drop list
        //
        self.aggregations_.length > 1
          ? $('.aggregationSelectionRow').show()
          : $('.aggregationSelectionRow').hide();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillAggregationDroplist: function () {
    // Append aggregations to droplist
    //
    for (var ii = 0; ii < this.aggregations_.length; ii++) {
      const aggr = this.aggregations_[ii];
      $('#launchAggregationList').append(
        '<li><a href="#" class="launchAggregation" title="' +
          aggr.key_node_name +
          '" id="' +
          aggr.aggr_id +
          '">' +
          aggr.getLabel() +
          '</a></li>'
      );
    }
  },

  setAggregationDroplistListener: function () {
    const self = this;

    $('.launchAggregation')
      .unbind()
      .click(function (e) {
        $('#invalid-url-arguments-panel').hide();

        // Get the selected aggregation from click event
        //
        const target = $(e.currentTarget);
        const id = toNumber(target[0].id);
        self.selectedAggregation_ = id;
        localStorage.setItem(Globals.SELECTED_AGGREGATION_KEY, id);
        self.selectAggregation(id);

        // Update browser's URL with new aggregation selection
        //
        var str = window.location.search;
        str = replaceQueryParam(Globals.SELECTED_AGGREGATION_URL, id, str);
        history.replaceState({}, '', window.location.pathname + str);

        // Load iteration parameters based on aggregation/domain keys
        //
        Globals.init(
          localStorage.getItem(Globals.SELECTED_AGGREGATION_KEY),
          localStorage.getItem(Globals.SELECTED_DOMAIN_KEY)
        );

        // Call the view listener so the view can updates its visualization
        //
        for (var listener of self.aggregationDroplistListeners_) {
          listener.droplistListener(
            e,
            localStorage.getItem(Globals.SELECTED_AGGREGATION_KEY),
            localStorage.getItem(Globals.SELECTED_DOMAIN_KEY)
          );
        }
      });
  },

  selectAggregation: function (aggrID) {
    // Update button with selected aggregation
    //
    aggregationSelectionText = this.getAggregationSelectionText(aggrID);
    $('#aggregationDroplist').html(
      aggregationSelectionText + ' <span class="caret"></span>'
    );
  },

  getAggregationSelectionText: function (aggrID) {
    const self = this;

    var aggr = $.grep(self.aggregations_, function (e) {
      return e.aggr_id == aggrID;
    });

    aggregationSelectionText = '';
    if (aggr.length !== 0) {
      aggregationSelectionText = aggr[0].getLabel();
    }

    return aggregationSelectionText;
  },

  getDefaultAggregationSelection: function () {
    const self = this;
    const lastAggregation = self.aggregations_.length - 1;
    return self.aggregations_[lastAggregation].aggr_id;
  },

  validateAggregation: function (scope, aggrID) {
    isValid = true;

    aggregationSelectionText = scope.getAggregationSelectionText(aggrID);
    if (aggregationSelectionText.length === 0) {
      isValid = false;
    }

    return isValid;
  },

  addAggregationDroplistListener(listener) {
    this.aggregationDroplistListeners_.push(listener);
  },
};
