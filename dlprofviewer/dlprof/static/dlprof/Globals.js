/* !@file Globals.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function Globals() {
  this.faCheck = '<span><i class="fa fa-check" aria-hidden="true"></i></span>';
  this.faTimes = '<span><i class="fa fa-times" aria-hidden="true"></i></span>';
  this.MANTISSA_LENGTH = 3;
  this.SELECTED_AGGREGATION_KEY = 'dlprof.selectedAggregationID';
  this.SELECTED_DOMAIN_KEY = 'dlprof.selectedDomainName';
  this.EXP_SYS_PROBLEM_KEY = 'dlprof.expert.systems.problem.key';
  this.EXP_SYS_RECOMMENDATION_KEY = 'dlprof.expert.systems.recommendation.key';
  this.EXP_SYS_ARGS_KEY = 'dlprof.expert.systems.args.key';
  this.SELECTED_AGGREGATION_URL = 'aggrID';
  this.SELECTED_DOMAIN_URL = 'domainName';

  this.GREAT = '#0079DB';
  this.GOOD = '#9fe051';
  this.OK = '#B6C5E2';
  this.WARNING1 = '#ffd96c';
  this.WARNING2 = '#ffb347';
  this.WARNING3 = '#d58f20';
  this.BAD = '#DBA3B4';

  this.isPytorchFramework_ = null;
  this.profileName_ = null;
  this.gpuCount_ = null;
  this.iterStart_ = null;
  this.iterStop_ = null;
  this.iterTotal_ = null;
  this.iterProfiled_ = null;
  this.keyOpName_ = null;

  this.loadSysConfigParameters();
}

Globals.prototype = {
  constructor: Globals,

  init: function (aggrID, domainName) {
    this.loadIterationParameters(aggrID, domainName);
  },

  isPytorchFramework: function () {
    return this.isPytorchFramework_;
  },

  getProfileName: function () {
    return this.profileName_;
  },

  getGpuCount: function () {
    return this.gpuCount_;
  },

  getIterStart: function () {
    return this.iterStart_;
  },

  getIterStop: function () {
    return this.iterStop_;
  },

  getIterTotal: function () {
    return this.iterTotal_;
  },

  getIterProfiled: function () {
    return this.iterProfiled_;
  },

  getKeyOpName: function () {
    return this.keyOpName_;
  },

  loadIterationParameters: function (aggrID, domainName) {
    var psp = new PerformanceSummaryPanel();
    var model = psp.loadPerformanceSummary(aggrID, domainName);
    this.iterStart_ = model['iter_start'];
    this.iterStop_ = model['iter_stop'];
    this.iterTotal_ = model['total_iterations'];
    this.iterProfiled_ = model['profiled_iterations'];
    this.keyOpName_ = model['key_node'];
  },

  loadSysConfigParameters: function () {
    const self = this;

    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/sysconfig_panel',
      async: false,
      success: function (jqXHR, textStatus, errorThrown) {
        self.isPytorchFramework_ =
          jqXHR['mode_string'].toLowerCase() == 'pytorch';
        self.gpuCount_ = jqXHR['num_gpus'];
        var dbProfileName = jqXHR['profile_name'];
        self.profileName_ = dbProfileName.length > 0 ? dbProfileName : 'DLProf';
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },
};
