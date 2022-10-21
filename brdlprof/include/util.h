/*
 * Copyright (c) 2022 by Biren Technologies Inc.
 * All Rights Reserved.
 */

#ifndef __UTIL_H
#define __UTIL_H

#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include <errno.h>
#include <fstream>
#include <iostream>
#include <stdarg.h>
#include <sys/types.h>
#include <unistd.h>
#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif

#include "spdlog/spdlog.h"
#include "supti.h"
#include "supti_gpa.h"
#include "supti_log.h"
#include <atomic>
#include <thread>
#ifdef __cplusplus

#include <iostream>
#include <time.h>
extern "C" {
static inline int util_get_tid();
}

struct StopWatch {
  public:
    void start(const char *comms) {
        DEBUG("(tid: %d)sw started. %s\n", util_get_tid(), comms);
        _start = rdtsc();
    }

    void stop(const char *comms) {
        clock_t total = rdtsc() - _start;
        DEBUG("(tid %d) [%s]elapsed tick: %ld\n", util_get_tid(), comms,
              (long)total);
    }

  private:
    long _start;
};

#endif
#ifdef __cplusplus
extern "C" {
#endif
#include <pthread.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>

extern char *program_invocation_short_name;

static inline void util_get_tick(long *sec, long *usec) {
    struct timespec tp;
    clockid_t clk_id;

    clk_id = CLOCK_MONOTONIC;
    clock_gettime(clk_id, &tp);
    if (sec)
        *sec = tp.tv_sec;
    if (usec)
        *usec = tp.tv_nsec / 1000;
}

static inline double util_get_gpu_time() {
    unsigned long gpuTick = 0;
    double time = 0.0f;

    if (GPA_GetGpuTick(&gpuTick) == GPA_SUCCESS) {
        time = (double)gpuTick / 25000.0f;
    }

    return time;
}

static inline int util_get_tid() { return syscall(SYS_gettid); }

static inline int util_get_core_id(int pid) { return sched_getcpu(); }

static inline long util_print_trace_header(const char *dom, const char *type,
                                           const char *func, char *outstr) {
    long sec;
    long usec;

    util_get_tick(&sec, &usec);
    util_get_core_id(syscall(SYS_gettid));
    long activity_id;
    activity_id = suptiNewActivityId();
    sprintf(outstr, "[%08ld %s  %s  %ld.%06ld][%s-%ld %03d  %s %d]",
            (long)(activity_id), dom, type, sec, usec, supa_app_name,
            syscall(__NR_gettid), util_get_core_id(0), func, _device_id);

    return (long)activity_id;
}

static inline long util_print_trace_header_id(const char *dom, const char *type,
                                              const char *func, long act_id,
                                              char *outstr) {
    long sec;
    long usec;

    util_get_tick(&sec, &usec);
    sprintf(outstr, "[%08ld %s  %s  %ld.%06ld][%s-%ld %03d  %s %d]",
            (long)(act_id), dom, type, sec, usec, supa_app_name,
            syscall(__NR_gettid), util_get_core_id(0), func, _device_id);

    return (long)act_id;
}

__attribute__((unused)) static void util_print_trace(const char *fmt, ...) {
    va_list va;
    va_start(va, fmt);
    vfprintf(suptiCreateEventLogFile(), fmt, va);
    // fflush(suptiCreateEventLogFile());
    va_end(va);
}

#ifdef __cplusplus
}
#endif

#endif
