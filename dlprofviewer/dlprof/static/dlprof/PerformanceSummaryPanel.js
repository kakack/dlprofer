/* !@file PerformanceSummary.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function PerformanceSummaryPanel() {}

PerformanceSummaryPanel.prototype = {
  constructor: PerformanceSummaryPanel,

  fill: function(aggrID, domainName) {
    var model = this.loadPerformanceSummary(aggrID, domainName);
    this.fillTable(model);
  },

  loadPerformanceSummary: function(aggrID, domainName) {
    var returnvalue;

    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/performance_summary_panel',
      data: {aggregation: aggrID, domain: domainName},
      async: false,
      success: function(jqXHR, textStatus, errorThrown) {
        returnvalue = jqXHR;
      },
      error: function(jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });

    return returnvalue;
  },

  fillTable: function(db) {
    var wallTime = db['wall_clock_time'];
    var wallTimeValue = convertUnitsToHumanReadable(wallTime).value;
    var wallTimeUnits = convertUnitsToHumanReadable(wallTime).units;
    $('#perfWallTime').text(wallTimeValue);
    $('#perfWallUnits').text(wallTimeUnits);

    var avgIterationTime = db['iter_avg'];
    var avgIterationTimeValue =
        convertUnitsToHumanReadable(avgIterationTime).value;
    var avgIterationTimeUnits =
        convertUnitsToHumanReadable(avgIterationTime).units;
    $('#perfAverageIterationTime').text(avgIterationTimeValue);
    $('#perfAverageIterationUnits').text(avgIterationTimeUnits);

    renderNumber('#perfIterationTotal', db['total_iterations']);
    renderNumber('#perfIterationStart', db['iter_start']);
    renderNumber('#perfIterationStop', db['iter_stop']);
    renderNumber('#perfIterationAggregated', db['profiled_iterations']);

    const tcUtilization = numberToDecimal(db['tc_utilization'], 1);
    $('#perfTcUtilization').text(tcUtilization);

    const gpuUtilization = numberToDecimal(db['gpu_utilization'], 1);
    $('#perfGpuUtilizationPercent').text(gpuUtilization);
  },
};
