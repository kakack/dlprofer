/*
 * Copyright (c) 2022 by Biren Technologies Inc.
 * All Rights Reserved.
 */

#ifndef __SUPTI_GPA_H
#define __SUPTI_GPA_H
#include "supti_types.h"

#define SPC_DUMP_SLOT_SIZE (32 * 1024)
#define PERF_CTRL_GROUP_0 (0)

#ifdef __cplusplus
extern "C" {
#endif
#include <stdint.h>
#include <stdio.h>

#define GPA_SEG_HEADER_VERSION                                                 \
    ((0 * 1000 + 1 * 10 + 0) & 0xFFFF) ///<(major*1000+minor*10+patch)

typedef enum {
    GPA_SUCCESS = 0,
    GPA_FAIL = 1,
    GPA_RETRY = 2,
    GPA_STATUS_NR
} GPA_Status;

/**
 * @brief The log header of each counter dump.
 *
 */
typedef struct {
    union {
        uint32_t sig_val;
        char sig_bytes[4];
    } sig;

    uint32_t group_id : 8;
    uint32_t counter_type : 16;
    uint32_t device_id : 8;

    uint32_t ts_low;
    uint32_t ts_high;
    uint32_t corr_id;
    uint32_t seq_id;
    uint32_t hdr_size;
    uint32_t dump_size;

    uint32_t hdr_version : 16;
    uint32_t die_id : 8;
    uint32_t reserved0 : 8;
    uint32_t reserved1[3];
} __attribute__((packed)) GPA_SEG_HEADER;

typedef enum {
    GPA_COUNTER_TYPE_RESERVED = 0,
    GPA_COUNTER_TYPE_SPC = 1,
    GPA_COUNTER_TYPE_CP = 2,
    GPA_COUNTER_TYPE_SDMA = 3,
    GPA_COUNTER_TYPE_NOC = 4,
    GPA_COUNTER_TYPE_HBMC = 5,
    GPA_COUNTER_TYPE_VIDEO = 6,
    GPA_COUNTER_TYPE_HA = 7,
    GPA_COUNTER_TYPE_DDR = 8,

    GPA_COUNTER_TYPE_TOPO = 128,
    GPA_COUNTER_TYPE_NR,
} GPA_COUNTER_TYPE;

typedef enum {
    GPA_COUNTER_LENGTH_RESERVED = 0,
    GPA_COUNTER_LENGTH_SPC = 32 * 1024,
    GPA_COUNTER_LENGTH_CP = 0,
    GPA_COUNTER_LENGTH_SDMA = 0,
    GPA_COUNTER_LENGTH_NOC = 2048,
    GPA_COUNTER_LENGTH_HBMC = 512,
    GPA_COUNTER_LENGTH_VIDEO = 0,
    GPA_COUNTER_LENGTH_HA = 320,

    GPA_COUNTER_LENGTH_TOPO = sizeof(SuptiTopology_t),
} GPA_COUNTER_LENGTH;

GPA_Status GPA_BeginSession(uint32_t session_id);
GPA_Status GPA_EndSession(uint32_t session_id);
GPA_Status GPA_EnableCounter(uint32_t index);
GPA_Status GPA_GetCounterValue(uint32_t *count);
GPA_Status GPA_DisbleCounter(uint32_t index);
GPA_Status GPA_PostPacket(void *pkt);
GPA_Status GPA_CounterFlush(char *fileName, GPA_SEG_HEADER hdr,
                            const void *data, int size);
GPA_Status GPA_CounterFlushFp(FILE *fpDump, GPA_SEG_HEADER hdr,
                              const void *data, int size);
GPA_Status GPA_GetGpuTick(unsigned long *gpuTs);
uint32_t GPA_GetCounterLength(uint32_t type);
GPA_Status GPA_CounterFlushByType(uint32_t type, const void *data,
                                  uint32_t devidx = 0, uint32_t corr_id = 0,
                                  uint32_t seq_id = 0, uint32_t ts_low = 0,
                                  uint32_t ts_high = 0);
#ifdef __cplusplus
}
#endif

#endif
