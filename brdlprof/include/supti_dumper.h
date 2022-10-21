/*************************************************************************
    > File Name: supti_dumper.h
    > Author: yanchang.li
    > Mail: yanchang.li@birentech.com
    > Created Time: 2022年01月23日 星期日 21时52分27秒
 ************************************************************************/

#ifndef _SUPTI_DUMPER_H
#define _SUPTI_DUMPER_H

#include <bebr.h>
#include <besu.h>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdlib.h>
#include <string>
#include <vector>

#define DUMP_BUFFER_SIZE (32 * 1024)

class IDUMP {

  public:
    virtual void Dump() = 0;
    virtual unsigned long Flush() = 0;
};

class PerfDumper : public IDUMP {

  public:
    PerfDumper(const char *file, int s = 0) : file_(file) {
        uint64_t rgnPitch;
        fileSubId = -1;
        dumpBuf = nullptr;
        besuNumaMallocDevice(&dumpBuf, &rgnPitch, 1, DUMP_BUFFER_SIZE,
                             BESU_MEM_ARCH_TYPE_UMA_4K);
        stream_ = s;
    }

    PerfDumper(int s = 0) {
        std::stringstream ss;
        ss << "perf_dump-" << inst_index++ << ".bin";
        ::new (this) PerfDumper(ss.str().c_str(), s);
    }

    ~PerfDumper() {
#if FIXED_IN_UMD
        if (dumpBuf)
            besuFree(dumpBuf);
#endif
    }

    PerfDumper &operator=(const PerfDumper &other) = delete;
    PerfDumper(const PerfDumper &other) = delete;

    void Location(const char *file) { file_ = file; }

    const char *Location() const { return file_.c_str(); }

    void Dump() override {
        static _InitCtrl inCtl;

        besuLaunchPerfControlDump(static_cast<BesuStream>(0), false, dumpBuf);
        fileSubId++;
    }

    unsigned long Flush() override {
        std::vector<char> hostBuf(DUMP_BUFFER_SIZE, 0);
        besuMemcpy(hostBuf.data(), dumpBuf, DUMP_BUFFER_SIZE);
        std::ofstream ofs(file_ + std::to_string(fileSubId));
        if (ofs) {
            ofs.write(hostBuf.data(), DUMP_BUFFER_SIZE);
            ofs.close();
        }

        return static_cast<unsigned long>(*(uint64_t *)hostBuf.data());
    }

  private:
    static int inst_index;
    std::string file_;
    void *dumpBuf;
    int stream_;
    int fileSubId;

  private:
    class _InitCtrl {
      public:
        _InitCtrl() {
            int group = 0;
            char *grp = nullptr;
            grp = getenv("PERF_GROUP");

            if (grp)
                group = std::stoi(std::string(grp), nullptr, 0);
            besuPerfControlStart(group);
            std::cout << "globally start dump group: " << group << std::endl;
        }

        ~_InitCtrl() { std::cout << "globally stop dump" << std::endl; }
    };
};

template <typename T> class SyncGroup {

  public:
    SyncGroup(std::vector<T *> vec, int s = 0) : vec_(vec) { stream_ = s; }
    SyncGroup(int s = 0) { stream_ = s; }

    void Add(T *item) { vec_.push_back(item); }

    void Add(T &item) { vec_.push_back(&item); }

    void Remove(T *item) {
        for (auto &itm : vec_) {
            if (item == item)
                vec_.erase(itm);
        }
    }

    int size() { return vec_.size(); }

    void DoSync() {
        besuStreamSynchronize(static_cast<BesuStream>(stream_));
        std::cout << "syncing now!" << std::endl;
    }

  private:
    class Dummy : public IDUMP {
        friend class SyncGroup<T>;

      public:
        Dummy(SyncGroup<T> *group) { syncgrp_ = group; }

        void Dump() override {
            // std::cout << "safe dump with sync wrapper." << std::endl;
            syncgrp_->need_sync_ = 1;
            syncgrp_->vec_[this->index_]->Dump();
        }

        unsigned long Flush() override {
            assert(syncgrp_);
            // std::cout << "safe flush with sync wrapper." << std::endl;
            if (syncgrp_->need_sync_) {
                syncgrp_->DoSync();
                syncgrp_->need_sync_ = 0;
            }
            return syncgrp_->vec_[this->index_]->Flush();
        }

        void Sync() {
            assert(syncgrp_);
            if (syncgrp_->need_sync_) {
                syncgrp_->DoSync();
                syncgrp_->need_sync_ = 0;
            }
        }

        void InitSync() {
            assert(syncgrp_);
            syncgrp_->need_sync_ = 1;
        }

        T *operator->() {
            // std::cout << "decorator executed" << std::endl;
            return syncgrp_->vec_[index_];
        }

      private:
        SyncGroup<T> *syncgrp_;
        int index_;
    };

  public:
    SyncGroup::Dummy operator[](int idx) {
        SyncGroup::Dummy dummy(this);
        dummy.index_ = idx;
        return dummy;
    }

  private:
    int need_sync_;
    std::vector<T *> vec_;
    int stream_;
};

using PERFGROUP = SyncGroup<PerfDumper>;

class PerfSamples {

  private:
    const int STREAM_ZERO = 0;
    PERFGROUP group_;
    PerfDumper *dumps_;

  public:
    PerfSamples() = delete;

    PerfSamples(int n) : group_(STREAM_ZERO) {
        dumps_ = new PerfDumper[n];
        for (int i = 0; i < n; i++) {
            group_.Add(&dumps_[i]);
        }
    }

    ~PerfSamples() { delete[] dumps_; }

    int size() { return group_.size(); }

    auto operator()(int idx) { return group_[idx]; }

    auto operator[](int idx) { return group_[idx]; }
};

/* Example:

 PerfSamples samples(4);

        samples[0].Dump();
        //do sth.
        samples[1].Dump();
        //do sth.
        samples[2].Dump();
        //do sth.
        samples[3].Dump();

        //do heavy loadings.

        //collecting results into files

        for (int s = 0; s < 4; s++) {
            std::cout << "cali perf ts field: " << samples[s].Flush()
                      << std::endl;
        }

*/
#endif
