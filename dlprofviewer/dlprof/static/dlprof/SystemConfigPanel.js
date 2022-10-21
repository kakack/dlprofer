/* !@file SystemConfigPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function SystemConfigPanel() {}

SystemConfigPanel.prototype = {
  constructor: SystemConfigPanel,

  fill: function () {
    this.loadSysConfig();
    this.loadGpuInfo();
  },
  loadSysConfig: function () {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/sysconfig_panel',
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.fillTable(jqXHR);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },
  loadGpuInfo: function () {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/gpu_info_data',
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.fillGpuInfo(jqXHR);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },
  fillTable: function (db) {
    const self = this;

    var isValid = db['is_valid'] == 1;

    if (isValid) {
      this.displayIfValid(db['profile_name'], '#systemConfigProfileName');

      this.displayIfValid(db['num_gpus'], '#systemConfigGpuCount');

      this.displayIfValid(db['cpu_model'], '#systemConfigCpuModel');
      this.displayIfValid(
        db['driver_version'],
        '#systemConfigCudaDriverVersion'
      );
      this.displayIfValid(db['framework'], '#systemConfigFramework');
      this.displayIfValid(db['supa_version'], '#systemConfigSupaVersion');
      this.displayIfValid(db['sudnn_version'], '#systemConfigSudnnVersion');
      this.displayIfValid(db['susight_version'], '#systemConfigSusightVersion');
      this.displayIfValid(
        db['dlprof_version'],
        '#systemConfigDlprofCliVersion'
      );
      this.displayIfValid(
        DbVersion.current_db_version,
        '#systemConfigDlprofDbVersion'
      );

      let viewerVersion = '';
      const appVersion = AppVersion.getAppVersion();
      if (appVersion.length > 0) {
        viewerVersion = appVersion;
      }

      const containerRelease = AppVersion.getContainerRelease();
      if (containerRelease.length > 0) {
        if (viewerVersion.length > 0) {
          viewerVersion += ' / ';
        }
        viewerVersion += containerRelease;
      }

      if (viewerVersion.length > 0) {
        $('#systemConfigDlprofViewerVersion').text(viewerVersion);
        $('#trDlprofViewerVersion').show();
      }

      $('#systemConfigPanel').show();
    }
  },

  displayIfValid: function (systemConfigItem, selector) {
    if (isNonEmptyString(systemConfigItem)) {
      $(selector).html(systemConfigItem);
    } else {
      $(selector).parent().remove();
    }
  },
  fillGpuInfo: function (response) {
    var gpuNames = '';
    for (var ii = 0; ii < response.length; ii++) {
      var row = response[ii];
      if (gpuNames.length > 0) {
        gpuNames += '<br/>';
      }
      gpuNames += '<span class="cudaNoWrap">' + row['gpu_name'] + '</span>';
    }
    this.displayIfValid(gpuNames, '#systemConfigGpuNames');
  },
};
