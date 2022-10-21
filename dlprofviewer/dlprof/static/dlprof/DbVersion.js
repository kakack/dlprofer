/* !@file DbVersion.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function DbVersion() {
  this.current_db_version; // example: numeric 1.2.0
  this.original_db_version; // example: numeric 1.2.0
  this._isValidDbVersion = false;
  this.doesDbVersionExist = this.doesDbVersionExist();
  if (this.doesDbVersionExist) {
    this.loadDbVersion();
    this.checkDbVersion();
  } else {
    showDatabaseVersionNotFoundError();
  }
}

DbVersion.prototype = {
  constructor: DbVersion,

  isValidDbVersion: function () {
    return this._isValidDbVersion;
  },

  doesDbVersionExist: function () {
    const self = this;
    var does_db_version_exist = false;

    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/does_db_version_exist',
      async: false,
      success: function (jqXHR, textStatus, errorThrown) {
        does_db_version_exist = jqXHR['does_db_version_exist'];
        self._isValidDbVersion = does_db_version_exist;
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });

    return does_db_version_exist;
  },

  loadDbVersion: function () {
    const self = this;

    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/db_version',
      async: false,
      success: function (jqXHR, textStatus, errorThrown) {
        self.current_db_version = jqXHR['current_version'];
        self.original_db_version = jqXHR['original_version'];
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  checkDbVersion: function () {
    const self = this;
    const EXPECTED_VERSION = AppVersion.getAppVersion();
    const COUNT = 3; // Omit trailing characters in the compare

    self._isValidDbVersion = strncmp(
      this.current_db_version,
      EXPECTED_VERSION,
      COUNT
    );

    if (!self.isValidDbVersion()) {
      console.error(
        'Bad DLPROF DB version: Expected=' +
          EXPECTED_VERSION +
          ', found=' +
          this.current_db_version
      );

      $('#foundDbVersion').text(this.current_db_version);
      $('#expectingDbVersion').text(EXPECTED_VERSION);
      showDatabaseTooNewError();
    }
  },
};
