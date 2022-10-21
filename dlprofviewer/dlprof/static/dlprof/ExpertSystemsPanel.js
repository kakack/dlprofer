/* !@file ExpertSystemsPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function ExpertSystemsPanel() {}

ExpertSystemsPanel.prototype = {
  constructor: ExpertSystemsPanel,

  fill: function (aggrID) {
    this.loadExpertSystems(aggrID);
  },

  loadExpertSystems: function (aggrID) {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/expert_systems_panel',
      data: {aggregation: aggrID},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.fillTable(jqXHR);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillTable: function (response) {
    if (response.length == 0) {
      $('#expertSystemsNoRecommendationsMessage').show();
    } else {
      // Clear the contents of the table
      //
      $('#feedbackTable tbody:gt(0)').empty();

      for (var ii = 0; ii < response.length; ii++) {
        var row = response[ii];

        const jsFunc = row['javascript_function'];
        const problem = row['problem'];
        const recommendation = row['recommendation'];
        const javascript_args = row['javascript_args'];

        // quotes have to be removed since this string is inside another quoted string
        //
        const escapedArgs = replaceAll(javascript_args, '"', '^');

        var buttonText = '';
        if (jsFunc != null && jsFunc.length > 0) {
          const func =
            jsFunc +
            "('" +
            problem +
            "','" +
            recommendation +
            "',`" +
            escapedArgs +
            '`);';

          const font =
            '<i class="fa fa-angle-double-right fa-2x fa-expert-systems"></i>';

          buttonText =
            '<span class="clickableAwesomeFont" onclick="' +
            func +
            '" title="Click to see more information">' +
            font +
            '</span>';
        }

        // wraps all links in recommendation with an `a href=` tag
        //
        const recommendation_linkified = recommendation.replace(
          /(https?\:\/\/[^\s]+)/g,
          '<a target="_blank" href="$1">$1</a>'
        );

        var html = '<tr>';
        html += '<td>' + buttonText + '</td>';
        html += '<td>' + problem + '</td>';
        html += '<td>' + recommendation_linkified + '</td>';
        html += '</tr>';

        $('#feedbackTable tbody:gt(0)').append(html);
        $('#feedbackTable').show();
      }
    }
  },
};

// This is called from the Expert Systems detector.
//
function ShowBadDataTypeOps(problem, recommendation, args) {
  const aggrID = AggregationDroplist.selectedAggregation_;
  const domainName = DomainDroplist.selectedDomain_;
  localStorage.setItem(Globals.EXP_SYS_PROBLEM_KEY, problem);
  localStorage.setItem(Globals.EXP_SYS_RECOMMENDATION_KEY, recommendation);
  localStorage.setItem(Globals.EXP_SYS_ARGS_KEY, args);

  var url = 'ops_and_kernels.html';
  url += '?' + Globals.SELECTED_AGGREGATION_URL + '=' + aggrID;
  url += '&' + Globals.SELECTED_DOMAIN_URL + '=' + domainName;
  window.location.href = url;
}

// This is called from the Expert Systems detector.
//
function ShowBadIterationRange(problem, recommendation, args) {
  const aggrID = AggregationDroplist.selectedAggregation_;
  const domainName = DomainDroplist.selectedDomain_;
  localStorage.setItem(Globals.EXP_SYS_PROBLEM_KEY, problem);
  localStorage.setItem(Globals.EXP_SYS_RECOMMENDATION_KEY, recommendation);
  localStorage.setItem(Globals.EXP_SYS_ARGS_KEY, args);

  var url = 'iterations_view.html';
  url += '?' + Globals.SELECTED_AGGREGATION_URL + '=' + aggrID;
  url += '&' + Globals.SELECTED_DOMAIN_URL + '=' + domainName;
  window.location.href = url;
}
