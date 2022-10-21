/* !@file ViewDroplist.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function ViewDroplist() {
  this.VIEW_DASHBOARD = 'Dashboard';
  this.VIEW_OP_TYPE_SUMMARY = 'Op Type Summary';
  this.VIEW_OPS_AND_KERNELS = 'Ops and Kernels';
  this.VIEW_KERNELS_BY_ITERATION = 'Kernels by Iteration';
  this.VIEW_KERNELS_BY_OP = 'Kernels by Op';
  this.VIEW_ITERATIONS = 'Iterations';
  this.VIEW_GPUS = 'GPUs';
  this.VIEW_GROUP_OPS = 'Group Ops';
}

ViewDroplist.prototype = {
  constructor: ViewDroplist,

  fillViewDroplist: function () {
    $('#launchViewList').append(
      '<li><a id="launchDashboard" href="dashboard.html">' +
        this.VIEW_DASHBOARD +
        '</a></li>'
    );
    $('#launchViewList').append(
      '<li><a id="launchOpTypeSummary" href="op_type_summary.html">' +
        this.VIEW_OP_TYPE_SUMMARY +
        '</a></li>'
    );
    $('#launchViewList').append(
      '<li><a id="launchViewGroupOps" href="group_ops_view.html">' +
        this.VIEW_GROUP_OPS +
        '</a></li>'
    );
    $('#launchViewList').append(
      '<li><a id="launchOpsAndKernels" href="ops_and_kernels.html">' +
        this.VIEW_OPS_AND_KERNELS +
        '</a></li>'
    );
    $('#launchViewList').append(
      '<li><a id="launchKernelsByIteration" href="kernels_by_iteration.html">' +
        this.VIEW_KERNELS_BY_ITERATION +
        '</a></li>'
    );
    $('#launchViewList').append(
      '<li><a id="launchKernelsByOp" href="kernels_by_op.html">' +
        this.VIEW_KERNELS_BY_OP +
        '</a></li>'
    );
    $('#launchViewList').append(
      '<li><a id="launchViewIterations" href="iterations_view.html">' +
        this.VIEW_ITERATIONS +
        '</a></li>'
    );

    if (Globals.getGpuCount() > 1) {
      $('#launchViewList').append(
        '<li><a id="launchViewGpus" href="gpus_view.html">' +
          this.VIEW_GPUS +
          '</a></li>'
      );
    }

    $('.viewSelectionRow').show();
  },

  selectView: function (viewName) {
    $('#launchViewEvent').html(viewName + ' <span class="caret"></span>');
  },
};
