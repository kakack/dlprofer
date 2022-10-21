/*
 * Copyright (c) 2022 by Biren Technologies Inc.
 * All Rights Reserved.
 */

#ifndef __SUTX_H
#define __SUTX_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief : Create a instantaneous mark event with a text message.
 * @param {char} *msg Message to comment this event.
 * @return {*}
 */
void sutx_mark(const char *msg);

/**
 * @brief : Mark the beginning of a code range.
 * @param {char} *msg Message to comment this event.
 * @return {int} The activity id associated with this mark event.
 */
int sutx_range_begin(const char *msg);

/**
 * @brief : Mark the end of a code range.
 * @param {char} *msg Message to comment this event.
 * @param {int} act_id The activity id returned by the sutx_range_begin.
 * @return {*}
 */
void sutx_range_end(const char *msg, int act_id);

#ifdef __cplusplus
}
#endif
#endif
