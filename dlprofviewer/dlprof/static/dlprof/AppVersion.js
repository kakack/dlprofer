/* !@file AppVersion.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION & AFFILIATES.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function AppVersion() {
  this.appVersion = '';
  this.containerRelease = '';
  this.fill();
}

AppVersion.prototype = {
  constructor: AppVersion,

  fill: function () {
    const self = this;

    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/app_version',
      async: false,
      success: function (jqXHR, textStatus, errorThrown) {
        self.appVersion = jqXHR['app_version'].toString();
        self.containerRelease = jqXHR['container_release'].toString();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  getAppVersion: function () {
    return this.appVersion;
  },

  getContainerRelease: function () {
    return this.containerRelease;
  },
};
