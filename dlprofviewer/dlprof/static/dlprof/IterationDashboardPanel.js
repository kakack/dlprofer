/* !@file IterationDashboardPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function IterationDashboardPanel() {
  this.chart_ = new IterationsChart();
}

IterationDashboardPanel.prototype = {
  constructor: IterationDashboardPanel,

  fill: function (aggrID, domainName) {
    this.chart_.initChart('#iterationDashboardChart', aggrID, domainName);
  },
};
