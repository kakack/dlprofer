/*************************************************************************
    > File Name: supti.h
    > Author: yanchang.li
    > Mail: yanchang.li@birentech.com
    > Created Time: 2021年06月02日 星期三 22时34分57秒
 ************************************************************************/

#ifndef __SUPTI_H
#define __SUPTI_H
#include "supti_global_config.h"
#include "supa_common_types.h"
#include "supti_common.h"
#include "supti_gpa.h"
#include "supti_ha.h"
#include "supti_log.h"
#include "supti_noc.h"
#include "supti_types.h"
#include <besu.h>
#include <condition_variable>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

/**
 * @brief Define Supti callback domain types.
 *
 */
typedef enum {
    SUPTI_CB_DOMAIN_INVALID = 0,
    SUPTI_CB_DOMAIN_BESU = 1,
    SUPTI_CB_DOMAIN_SUPA = 2,
    SUPTI_CB_DOMAIN_RESOURCE = 3,
    SUPTI_CB_DOMAIN_SYNCHRONIZATION = 4,
    SUPTI_CB_DOMAIN_SUTX = 5,
    SUPTI_CB_DOMAIN_SUCCL = 6,
    SUPTI_CB_DOMAIN_NR,
} supti_cb_domain_t;

extern SuptiGlobalConfig_t _supti_global_config;
extern SuptiCaptureContext_t _supti_capture_context;
extern __thread int _device_id;
extern int __supti_cpts_enable;
extern int __supti_profile_enable;
extern int __supti_host_only;

typedef struct {
    std::string dom_name;
    int enanle;
    std::vector<std::string> *dom_funcs;
    void (*bt_fun)(void *ctx, const char *bt_str);
} domain_ctrl_entry_t;

extern std::unordered_map<supti_cb_domain_t, domain_ctrl_entry_t> domainsCtrl;

#ifdef __cplusplus
extern "C" {
#include "string.h"
#endif
void suptiRegisterKernel(uint64_t func, const char *name);
const std::string suptiGetKernelName(uint64_t func);

#define GET_BESU_DLSYM(sym) (decltype(sym) *)dlsym(RTLD_NEXT, #sym)
#define DEF_BESU_SYM(sym) decltype(sym) *sym

/**
 * @brief Besu function table to avoid intercepted by supti.
 *
 * Some of besu functions are intercepted by supti, so invoke besu function
 * directly will cause confusion. Make sure use this function table to
 * invoke besu functions.
 *
 */
typedef struct {
    DEF_BESU_SYM(besuModuleGetFunction);
    DEF_BESU_SYM(besuLaunchDeviceFunc);
    DEF_BESU_SYM(besuStreamCreate);
    DEF_BESU_SYM(besuStreamDestroy);
    DEF_BESU_SYM(besuMemcpy);
    DEF_BESU_SYM(besuMemcpyAsync);
    DEF_BESU_SYM(besuSetDevice);
    DEF_BESU_SYM(besuEventRecordWithFlags);
    DEF_BESU_SYM(besuEventSynchronize);
    DEF_BESU_SYM(besuEventElapsedTime);
    DEF_BESU_SYM(besuLaunchPerfControlDump);
    DEF_BESU_SYM(besuStreamSynchronize);
    DEF_BESU_SYM(besuGetDeviceProperties);
    DEF_BESU_SYM(besuLaunchDeviceFuncWithSpcMask);
} besuFuncTable_t;
extern besuFuncTable_t besuFuncTable;

extern int __supti_profiling_enable;
extern char supa_app_name[32];

#define SUPTI_API
typedef enum {
    suPlainText = 0,

} SupaOutputMode_t;

typedef struct _callback {
    char *func;
    void *cb;
    supti_cb_domain_t dom;
    int enable;
    int bt_en;
} callback_t;

static inline unsigned long long rdtsc(void) {
    unsigned hi, lo;
    __asm__ __volatile__("rdtsc" : "=a"(lo), "=d"(hi));
    return ((unsigned long long)lo) | (((unsigned long long)hi) << 32);
}

/**
 * @brief Register a callback to supti core.
 *
 * @param key The key to find a callback, typically is the function name
 * @param cb Callback entry when function is invoked
 * @return int Always be 0
 */
int supti_register_tracer_callback(char *key, callback_t cb);
int supti_unregister_tracer_callback(char *key);

/**
 * @brief Enable a callback to run when the funciton is invoked.
 *
 * @param key The key to find a callback, typically is the function name
 */
void supti_enable_tracer_callback(char *key);
void supti_disable_tracer_callback(char *key);

/**
 * @brief The entry when supti profiling a function
 *
 * @param func function name to profile
 * @param is_entry Identify in entry or exit position
 * @param ...
 */
void supti_handler_entry(char *func, int is_entry, void *, ...);

SUPTI_API suError suptiProfilerInitialize(const char *configFIle,
                                          const char *outputFile,
                                          SupaOutputMode_t mode);

/**
 * @brief Supti start profiling.
 *
 * @return SUPTI_API suSuccess
 */
SUPTI_API suError suptiProfilerStart(void);

/**
 * @brief Supti stop profiling and flush logs to disk.
 *
 * @return SUPTI_API suSuccess
 */
SUPTI_API suError suptiProfilerStop(void);

/**
 * @brief Use a regular expression to select callbacks to enable.
 *
 * @param f regular expression string
 */
void supti_filter_enable(const char *f);
void supti_filter_disable(const char *);
long int supti_device_get_timestamp(void);

void supti_intercept_enable();
void supti_intercept_disable();
int supti_intercept_masked();

/**
 * @brief Inject a tracepoint in the target program.
 *
 */
#define TRACE(x, arg...)                                                       \
    do {                                                                       \
        if (__supti_profile_enable) {                                          \
            supti_handler_entry((char *)__func__, (x), ##arg);                 \
        }                                                                      \
    } while (0)

/**
 * @brief Inject a tracepoint at the entry of the function.
 *
 */
#define TRACE_ENTER(arg...)                                                    \
    void *__tr_context = NULL;                                                 \
    ({                                                                         \
        if (__supti_profile_enable) {                                          \
            supti_handler_entry((char *)__func__, 1, (void *)&__tr_context,    \
                                ##arg);                                        \
        }                                                                      \
    })

/**
 * @brief Inject a tracepoint at the exit of the function.
 *
 */
#define TRACE_EXIT(arg...)                                                     \
    do {                                                                       \
        if (__supti_profile_enable) {                                          \
            supti_handler_entry((char *)__func__, -1, __tr_context, ##arg);    \
        }                                                                      \
    } while (0)

#ifdef __cplusplus
}
#endif

template <class Derived> struct IActivity {
    struct {
        uint32_t size;
        uint32_t activity_id;
        uint32_t activity_subid;
        uint32_t correlation_id;
    } hdr;
    char data[0];

  public:
    IActivity() { hdr.size = sizeof(Derived); }
    void serialize(void *buf) {
        if (buf)
            memcpy(buf, (void *)this, hdr.size);
    }
    void *get() { return this; }
} __attribute__((packed));

#define PR_MACRO_UN(...) #__VA_ARGS__
#define PR_MACRO(_x) PR_MACRO_UN(_x)

#define __INITF__ __attribute__((constructor))
#define __FINIF__ __attribute__((destructor))

#define __INITIALIZER__(d)                                                     \
    void initialize_##d(void) __INITF__;                                       \
    void initialize_##d(void)

#define __FINALIZER__(d)                                                       \
    void __clean_up_##d(void *param) __FINIF__;                                \
    void __clean_up_##d(void *param)

#endif

/**
 * @file supti.h
 * How does tracer interact with supti?
 * assume to be set by env variables and passed to cuda.so constructor function,
 * in tracee process? No, should always be called even if in normal run, on
 * which condition there's no injlib preloaded so that nothing will be traced.
 */
