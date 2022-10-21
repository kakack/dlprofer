/* !@file Dashboard.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function Dashboard() {
  document.title = 'DLProf: Dashboard';

  const self = this;
  self.performanceSummaryPanel_ = new PerformanceSummaryPanel();
  self.iterationDashboardPanel_ = new IterationDashboardPanel();
  self.systemConfigInfoPanel_ = new SystemConfigPanel();
  self.tcUtilizationPanel_ = new TcUtilizationPanel();
  self.domainModelGpuUtilizationPanel_ = new DomainModelGpuUtilizationPanel();
  self.resourceUsageBreakdownPanel_ = new ResourceUsageBreakdownPanel();
  self.kernelSummaryPanel_ = new KernelSummaryPanel();
  self.expertSystemsPanel_ = new ExpertSystemsPanel();
  self.topTenOpsPanel_ = new TopTenOpsPanel();
}

Dashboard.prototype = {
  constructor: Dashboard,

  fillDashboard: function (aggrID, domainName) {
    const self = this;
    self.domainModelGpuUtilizationPanel_.fill(aggrID, domainName);
    self.resourceUsageBreakdownPanel_.fill(aggrID, domainName);
    self.kernelSummaryPanel_.fill(aggrID, domainName);
    self.tcUtilizationPanel_.fill(aggrID, domainName);
    self.performanceSummaryPanel_.fill(aggrID, domainName);
    self.topTenOpsPanel_.fill(aggrID, domainName);
    self.systemConfigInfoPanel_.fill();
    self.expertSystemsPanel_.fill(aggrID);
    self.iterationDashboardPanel_.fill(aggrID, domainName);
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.fillDashboard(aggrID, domainName);
  },
};
