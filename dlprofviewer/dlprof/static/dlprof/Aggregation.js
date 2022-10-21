/* !@file Aggregation.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function Aggregation() {
  this.aggr_id;
  this.aggr_label;
  this.iter_start;
  this.iter_stop;
  this.iter_aggregated;
  this.key_node_name;
  this.user_name;
  this.host_name;
  this.aggr_start;
  this.aggr_end;
}

Aggregation.prototype = {
  constructor: Aggregation,

  initAggregation: function (dbRow) {
    this.aggr_id = dbRow['aggr_id'];
    this.iter_start = dbRow['iter_start'];
    this.iter_stop = dbRow['iter_stop'];
    this.iter_aggregated = dbRow['iter_aggregated'];
    this.key_node_name = dbRow['key_node_name'];
    this.user_name = dbRow['user_name'];
    this.host_name = dbRow['host_name'];
    this.aggr_start = dbRow['aggr_start'];
    this.aggr_end = dbRow['aggr_end'];
  },

  getLabel: function () {
    return '' + this.iter_start + ' to ' + this.iter_stop;
  },
};
