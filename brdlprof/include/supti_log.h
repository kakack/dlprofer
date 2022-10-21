/*
 * Copyright (c) 2022 by Biren Technologies Inc.
 * All Rights Reserved.
 */

#ifndef SUPTI_LOG_H
#define SUPTI_LOG_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdio.h>

FILE *suptiGetSpcLogFile(void);
FILE *suptiCreateEventLogFile(void);
void suptiCleanUpEventLogFile(void);
void suptiCleanUpSpcLogFile(void);
int suptiNewActivityId(void);
char *suptiGetHbmcLogFile(void);
#ifdef __cplusplus
}
#endif
#endif
