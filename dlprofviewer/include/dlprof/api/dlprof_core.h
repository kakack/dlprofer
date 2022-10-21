// Copyright (c) 2021, NVIDIA CORPORATION. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//  * Neither the name of NVIDIA CORPORATION nor the names of its
//    contributors may be used to endorse or promote products derived
//    from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#pragma once

/// \file

#include <cstdint>

#ifdef __cplusplus
extern "C" {
#endif

#ifdef _COMPILING_DLPROFCORE
#if defined(_MSC_VER)
#define DLPROF_DECLSPEC __declspec(dllexport)
#elif defined(__GNUC__)
#define DLPROF_DECLSPEC __attribute__((__visibility__("default")))
#else
#define DLPROF_DECLSPEC
#endif
#else
#if defined(_MSC_VER)
#define DLPROF_DECLSPEC __declspec(dllimport)
#else
#define DLPROF_DECLSPEC
#endif
#endif

/// Struct that holds parameters used for aggregating profiling data.
///
struct DLPROF_AggregateParams {
  const char* key_op;
  uint32_t iter_start = 0;
  uint32_t iter_stop = 0;
};

enum RETURN_CODES { SUCCESS = 0, FAILURE = 1 };

/// Helper method for DLPROF_init that takes database paths.
///
/// \param input_db Path to input database (eg, nsys database).
/// \param core_db Path to dlprof core database.
/// \return 0 or 1 indicating success or failure, respectively.
DLPROF_DECLSPEC uint32_t
DLPROF_init_by_file(const char* input_db, const char* core_db);


/// Initializes the DLProf CORE API by passing in the input database (input_db).
/// This method will copy the core data from the input database (ops and
/// kernels) and place into DLProf core database (core_db).
///
/// \param input_db Handle to input database (eg, nsys database).
/// \param core_db Handle to dlprof core database.
/// \return 0 or 1 indicating success or failure, respectively.
DLPROF_DECLSPEC uint32_t DLPROF_init(void* input_db, void* core_db);


/// Aggregates the profiling data.
///
/// \param core_db Path to dlprof core database.
/// \param params Parameters used to specify how to aggregate profile data.
/// \return 0 or 1 indicating success or failure, respectively.
DLPROF_DECLSPEC uint32_t DLPROF_aggregate_by_file(
    const char* core_db, const DLPROF_AggregateParams* params);


/// Aggregates the profiling data.
///
/// \param core_db Handle to dlprof core database.
/// \param params Parameters used to specify how to aggregate profile data.
/// \return 0 or 1 indicating success or failure, respectively.
DLPROF_DECLSPEC uint32_t
DLPROF_aggregate(void* core_db, const DLPROF_AggregateParams* params);


/// Returns whether or not specified kernel uses Tensor Cores.
///
/// \param kernel_name Name of kernel.
/// \return a boolean indicating whether or not kernel uses Tensor Cores.
DLPROF_DECLSPEC bool DLPROF_KernelUsesTensorCores(const char* kernel_name);

/// Modifies an old DLProf database to be compatible with the current version of
/// DLProf.
///
/// \param core_db Path to dlprof core database.
/// \return 0 or 1 indicating success or failure, respectively.
DLPROF_DECLSPEC uint32_t DLPROF_upversion(const char* core_db);

#ifdef __cplusplus
}
#endif
