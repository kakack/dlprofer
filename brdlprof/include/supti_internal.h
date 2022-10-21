/*
 * Copyright (c) 2022 by Biren Technologies Inc.
 * All Rights Reserved.
 */

/**
 * @file supti_internal.h
 * This header file is for SUPA runtime and driver INTERNAL use only, other
 * code stack should not include this one.
 */

#ifndef __SUPTI_INTL_H
#define __SUPTI_INTL_H

#define likely(x) __builtin_expect(!!(x), 1)
#define unlikely(x) __builtin_expect(!!(x), 0)

typedef enum {
    SUPTI_SUCCESS = 0,
    SUPTI_FAIL = 1,
    SUPTI_RETRY = 2,
    SUPTI_STATUS_NR
} SUPTI_Status;

#ifdef __cplusplus
extern "C" {
#endif
#include <stdio.h>
void supti_handler_entry(char *func, int is_entry, void *, ...)
    __attribute__((weak));
void supti_handler_entry(char *func, int is_entry, void *, ...) {
    perror("[BUG] wrong entry!\n");
}

int __attribute__((weak)) __supti_profile_enable = 0;

typedef enum {
    suPlainText = 0,
} SupaOutputMode_t;

#define TRACE(x, arg...)                                                       \
    do {                                                                       \
        if (unlikely(__supti_profile_enable)) {                                \
            supti_handler_entry((char *)__func__, (x), ##arg);                 \
        }                                                                      \
    } while (0)

#define TRACE_ENTER(arg...)                                                    \
    void *__tr_context = NULL;                                                 \
    ({                                                                         \
        if (unlikely(__supti_profile_enable)) {                                \
            supti_handler_entry((char *)__func__, 1, (void *)&__tr_context,    \
                                ##arg);                                        \
        }                                                                      \
    })

#define TRACE_EXIT(arg...)                                                     \
    do {                                                                       \
        if (unlikely(__supti_profile_enable)) {                                \
            supti_handler_entry((char *)__func__, -1, __tr_context, ##arg);     \
        }                                                                      \
    } while (0)

static inline SUPTI_Status suProfilerInitialize(const char *configFile,
                                           const char *outputFile,
                                           SupaOutputMode_t mode) {

    return SUPTI_SUCCESS;
}

static inline SUPTI_Status suProfilerStart(void) {
    __supti_profile_enable = 1;

    return SUPTI_SUCCESS;
}

static inline SUPTI_Status suProfilerStop(void) {
    __supti_profile_enable = 0;

    return SUPTI_SUCCESS;
}

#ifdef __cplusplus
}
#endif
#endif
