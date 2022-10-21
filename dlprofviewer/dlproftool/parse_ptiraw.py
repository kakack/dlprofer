#!/usr/bin/env python3
import sys
import os
from struct import *
import csv
import shutil
import getopt

OPT_pair = 0
OPT_compute = 0
SUPTI_DEVICE_COUNT_MAX = 8
NOC_CSV_NAME = 'perf_dump_noc.csv'
NOC_HBMC_DATA_INDEX = [12, 13, 26, 27, 40, 41, 50, 51]
NOC_CSV_HEADER_HBMC = (
    'N00_R_HBMC', 'N00_W_HBMC',
    'N01_R_HBMC', 'N01_W_HBMC',
    'N02_R_HBMC', 'N02_W_HBMC',
    'N03_R_HBMC', 'N03_W_HBMC',
)
NOC_CSV_HEADER = (
    #MNode 00
    'N00_R_O_E', 'N00_R_O_N', 'N00_R_I_S', 'N00_R_I_W',
    'N00_W_O_E', 'N00_W_O_N', 'N00_W_I_S', 'N00_W_I_W',
    #'N00_R_HBMC', 'N00_W_HBMC',
    #MNode 01
    'N01_R_O_E', 'N01_R_O_N', 'N01_R_O_S', 'N01_R_I_N', 'N01_R_I_S', 'N01_R_I_W',
    'N01_W_O_E', 'N01_W_O_N', 'N01_W_O_S', 'N01_W_I_N', 'N01_W_I_S', 'N01_W_I_W',
    #'N01_R_HBMC', 'N01_W_HBMC',
    #MNode 02
    'N02_R_O_E', 'N02_R_O_N', 'N02_R_O_S', 'N02_R_I_N', 'N02_R_I_S', 'N02_R_I_W',
    'N02_W_O_E', 'N02_W_O_N', 'N02_W_O_S', 'N02_W_I_N', 'N02_W_I_S', 'N02_W_I_W',
    #'N02_R_HBMC', 'N02_W_HBMC',
    #MNode 03
    'N03_R_O_E', 'N03_R_O_S', 'N03_R_I_W', 'N03_R_I_N',
    'N03_W_O_E', 'N03_W_O_S', 'N03_W_I_W', 'N03_W_I_N',
    #'N03_R_HBMC', 'N03_W_HBMC',
    #MNode 10
    'N10_R_O_N', 'N10_R_O_W', 'N10_R_I_E', 'N10_R_I_S',
    'N10_W_O_N', 'N10_W_O_W', 'N10_W_I_E', 'N10_W_I_S',
    #MNode 11
    'N11_R_O_N', 'N11_R_O_S', 'N11_R_O_W', 'N11_R_I_E', 'N11_R_I_N', 'N11_R_I_S',
    'N11_W_O_N', 'N11_W_O_S', 'N11_W_O_W', 'N11_W_I_E', 'N11_W_I_N', 'N11_W_I_S',
    #MNode 12
    'N12_R_O_N', 'N12_R_O_S', 'N12_R_O_W', 'N12_R_I_E', 'N12_R_I_N', 'N12_R_I_S',
    'N12_W_O_N', 'N12_W_O_S', 'N12_W_O_W', 'N12_W_I_E', 'N12_W_I_N', 'N12_W_I_S',
    #MNode 13
    'N13_R_O_S', 'N10_R_O_W', 'N13_R_I_E', 'N13_R_I_N',
    'N13_W_O_S', 'N13_W_O_W', 'N13_W_I_E', 'N13_W_I_N',
)

HA_CSV_NAME = 'perf_dump_ha.csv'
HA_CSV_HEADER = (
    'PORT0_I_R', 'PORT0_I_W', 'PORT0_T_R', 'PORT0_T_W',
    'PORT1_I_R', 'PORT1_I_W', 'PORT1_T_R', 'PORT1_T_W',
    'PORT2_I_R', 'PORT2_I_W', 'PORT2_T_R', 'PORT2_T_W',
    'PORT3_I_R', 'PORT3_I_W', 'PORT3_T_R', 'PORT3_T_W',
    'PORT4_I_R', 'PORT4_I_W', 'PORT4_T_R', 'PORT4_T_W',
)

class GpuTopology:
    inited = 0
    card_map = []
    port_map = []

    def __init__(self, buf):
        if len(buf) == 0:
            return
        for i in range(SUPTI_DEVICE_COUNT_MAX) :
            self.card_map.append(unpack('<i', buf[i*4:i*4+4])[0])
        print("card_map:", end="")
        for i in range(SUPTI_DEVICE_COUNT_MAX) :
            print(" %d" % self.card_map[i], end="")
        print("")

        buf_port = buf[SUPTI_DEVICE_COUNT_MAX*4:]
        for i in range(SUPTI_DEVICE_COUNT_MAX) :
            card = []
            for j in range(SUPTI_DEVICE_COUNT_MAX) :
                card.append(unpack('<i', buf_port[i*4*SUPTI_DEVICE_COUNT_MAX+j*4:i*4*SUPTI_DEVICE_COUNT_MAX+j*4+4])[0])
            self.port_map.append(card)

        for i in range(SUPTI_DEVICE_COUNT_MAX) :
            print("card%d port map:" % i, end="")
            for j in range(SUPTI_DEVICE_COUNT_MAX) :
                print(" %d" % self.port_map[i][j], end="")
            print("")
        inited = 1

    def getCardId(self, dev_idx) :
        return self.card_map[dev_idx]

    def getPort(self, src, dest) :
        #print("getPort: src=%d, dest=%d" %(src, dest))
        return self.port_map[self.getCardId(src)][self.getCardId(dest)]


    pass


class HeaderParser:
    def __init__(self, buf):
        self.name = 'header'
        self.type_dict = {
            0:'reserved',
            1:'spc',
            2:'cp',
            3:'sys',
            4:'noc',
            5:'hbmc',
            6:'video',
            7:'ha',
            128: 'topo'
        }

        self.data_buf = buf
        self.signature = unpack('<4s', buf[0:4])[0]
        self.group_id = int.from_bytes(buf[4:5],"little")
        self.type_id  = int.from_bytes(buf[5:7],"little")
        self.device_id  = int.from_bytes(buf[7:8],"little")

        self.gputs_low = unpack('<f', buf[8:12])[0]
        self.gputs_high = unpack('<f', buf[12:16])[0]
        self.corrid = unpack('<i', buf[16:20])[0]
        self.seqid = unpack('<i', buf[20:24])[0]
        self.header_size = int.from_bytes(buf[24:28],"little")
        self.body_size = int.from_bytes(buf[28:32],"little")
        if self.header_size > 32 :
            self.header_version = int.from_bytes(buf[32:34],"little")
            self.die_id = int.from_bytes(buf[34:35],"little")
        else :
            self.header_version = 0
            self.die_id = 0

    def is_valid(self):
        #print(self.signature)
        if self.signature == b'BRPF':
            #print(self.signature)
            return True
        else:
            return False

    def type_to_string(self):
            return self.type_dict.get(self.type_id, 'unkown')

    def get_body_size(self):
        return self.body_size


class CounterParser:
    g_none_corr_id = 0
    hbmc_csv_inited = False
    hbmc_csv_header = []
    noc_csv_inited = False
    noc_csv_header = []
    ha_csv_inited = False
    ha_csv_header = []
    gpuTopology = GpuTopology([])

    def __init__(self):
        self.name = 'counter'
    def parse_spc(self, gputs, contents, corr, seq, grp, length, device_id):

        print('now parse spc couters[corr:%d, seq:%d, grp:%d]...' % (corr, seq, grp))
        slice_out = 'perf_dump_spc'
        if corr == -1:
            CounterParser.g_none_corr_id += 1
            slice_out = 'None-' + str(CounterParser.g_none_corr_id) + '_' + slice_out
        else:
            slice_out = str(corr) + '_' + slice_out

        slice_out_bin = slice_out
        if seq == 1:
            slice_out_bin = slice_out + '-begin.bin'
        elif seq == -1:
            slice_out_bin = slice_out + '-end.bin'
        else:
            slice_out_bin = slice_out + '-seq' + str(seq) + '.bin'

        with open(slice_out_bin, 'wb+') as fout:
            fout.write(contents)
            fout.close()
            if seq == 1:
                if OPT_pair == 1:
                    pfc_path = os.path.join(sys.path[0],'pfc_dump')
                    os.system(pfc_path + ' ' + slice_out_bin + ' ' + str(grp) + ' ' + str(seq))
                pass
            elif seq == -1:
                if OPT_pair == 1:
                    pfc_path = os.path.join(sys.path[0],'pfc_dump')
                    os.system(pfc_path + ' ' + slice_out_bin + ' ' + str(grp) + ' ' + str(seq))
                pfc_path = os.path.join(sys.path[0],'pfc_dump_diff')
                os.system(pfc_path + ' ' + slice_out + ' ' + str(grp) + ' ' + str(seq))
                os.system('rm -rf' + ' ' + slice_out + '-begin.bin')
                os.system('rm -rf' + ' ' + slice_out + '-end.bin')
            else:
                pfc_path = os.path.join(sys.path[0],'pfc_dump')
                os.system(pfc_path + ' ' + slice_out_bin + ' ' + str(grp))
                os.system('rm -rf' + ' ' + slice_out_bin)

        pass

    def parse_hbmc(self, gputs, contents, corr, seq, grp, length, device_id):
        hbmc_regs = {
            0: 'wac',
            4: 'rac',
            8: 'wdc',
            12: 'rdc',
        }
        print('now parse hbmc couters[ts: %f, corr:%d, seq:%d size:%d]...' % (gputs, corr, seq, len(contents)))
        if not len(contents) == 512:
            return
        slice_out = 'perf_dump_hbmc.csv'
        '''
        if corr == -1:
            CounterParser.g_none_corr_id += 1
            slice_out = 'None-' + str(CounterParser.g_none_corr_id) + '_' + slice_out
        else:
            slice_out = str(corr) + '_' + slice_out

        if seq == 1:
            slice_out += '-begin.bin'
        elif seq == -1:
            slice_out += '-end.bin'
        else:
            slice_out += '-seq' + str(seq) + '.bin'
        '''
        #with open(slice_out, 'wb+') as fout:
        #    fout.write(contents)
        #    fout.close()
        #    pfc_path = os.path.join(sys.path[0],'pfc_dump')
            #os.system(pfc_path + ' ' + slice_out + ' ' + str(grp))
        if not CounterParser.hbmc_csv_inited:
            try:
                os.remove(slice_out)
            except:
                pass
        with open(slice_out, 'a+') as fout:
            if not CounterParser.hbmc_csv_inited:
                CounterParser.hbmc_csv_header.append('gputs')
                for mc in range(16):
                    for v in hbmc_regs.values():
                        CounterParser.hbmc_csv_header.append(v + 'die0.' + str(mc))

                for mc in range(16):
                    for v in hbmc_regs.values():
                        CounterParser.hbmc_csv_header.append(v + 'die1.' + str(mc))
                writer = csv.DictWriter(fout, delimiter=',', fieldnames=CounterParser.hbmc_csv_header)
                writer.writeheader()
                CounterParser.hbmc_csv_inited = True
            else:
                writer = csv.DictWriter(fout, delimiter=',', fieldnames=CounterParser.hbmc_csv_header)

            values = [gputs]
            for i in range(int(512 / 4)):
                cnt = unpack('<I', contents[i*4:i*4+4])[0]
                values.append(cnt)
                i += 1
            dic = dict(zip(CounterParser.hbmc_csv_header, values))
            #print(dic)
            writer.writerow(dic)
        pass
    def parse_noc(self, gputs, contents, corr, seq, grp, length, device_id):
        print('now parse noc couters[corr:%d, seq:%d]...' % (corr, seq))
        if not len(contents) == 2048:
            return

        if not CounterParser.noc_csv_inited:
            try:
                os.remove(NOC_CSV_NAME)
            except:
                pass
        with open(NOC_CSV_NAME, 'a+') as fout:
            if not CounterParser.noc_csv_inited:
                CounterParser.noc_csv_header.append('gputs')
                if OPT_compute == 1:
                    CounterParser.noc_csv_header.append('seq')
                    CounterParser.noc_csv_header.append('corrid')
                for d in ['D0_', 'D1_']:                #DIE id
                    for v in NOC_CSV_HEADER_HBMC:       #Probe id
                        CounterParser.noc_csv_header.append(d + v)
                for d in ['D0_', 'D1_']:                #DIE id
                    for v in NOC_CSV_HEADER:            #Probe id
                        CounterParser.noc_csv_header.append(d + v)

                writer = csv.DictWriter(fout, delimiter=',', fieldnames=CounterParser.noc_csv_header)
                writer.writeheader()
                CounterParser.noc_csv_inited = True
            else:
                writer = csv.DictWriter(fout, delimiter=',', fieldnames=CounterParser.noc_csv_header)

            values = [gputs]
            if OPT_compute == 1:
                values.append(seq)
                values.append(corr)

            #parse hbmc data in die0
            for i in NOC_HBMC_DATA_INDEX:
                cnt = unpack('<Q', contents[i*8:i*8+8])[0]
                values.append(cnt)
            #parse hbmc data in die1
            for i in NOC_HBMC_DATA_INDEX:
                i += 128
                cnt = unpack('<Q', contents[i*8:i*8+8])[0]
                values.append(cnt)
            #parse other noc data
            for i in range(int(2048 / 8)):
                #skip counter header of each die
                if i < 4 or i in range(128, 128 + 4) or i in NOC_HBMC_DATA_INDEX or (i - 128) in NOC_HBMC_DATA_INDEX:
                    continue
                cnt = unpack('<Q', contents[i*8:i*8+8])[0]
                values.append(cnt)
                i += 1
            dic = dict(zip(CounterParser.noc_csv_header, values))
            #print(dic)
            writer.writerow(dic)
        pass
    def parse_cp(self, gputs, contents, corr, seq, grp, length, device_id):
        print('now parse cp couters[%d, %d]...' % (corr, seq))
        pass
    def parse_ha(self, gputs, contents, corr, seq, grp, length, device_id):
        print('now parse ha couters[corr:%d, seq:%d]...' % (corr, seq))
        if not len(contents) == length:
            return

        if not CounterParser.ha_csv_inited:
            try:
                os.remove(HA_CSV_NAME)
            except:
                pass
        with open(HA_CSV_NAME, 'a+') as fout:
            if not CounterParser.ha_csv_inited:
                CounterParser.ha_csv_header.append('gpu/rank')
                CounterParser.ha_csv_header.append('gputs')
                if OPT_compute == 1:
                    CounterParser.ha_csv_header.append('seq')
                    CounterParser.ha_csv_header.append('corrid')
                CounterParser.ha_csv_header.append(">>host")
                for d in range(SUPTI_DEVICE_COUNT_MAX):
                    CounterParser.ha_csv_header.append(">>gpu" + str(d))
                CounterParser.ha_csv_header.append("<<host")
                for d in range(SUPTI_DEVICE_COUNT_MAX):
                    CounterParser.ha_csv_header.append("<<gpu" + str(d))

                writer = csv.DictWriter(fout, delimiter=',', fieldnames=CounterParser.ha_csv_header)
                writer.writeheader()
                CounterParser.ha_csv_inited = True
            else:
                writer = csv.DictWriter(fout, delimiter=',', fieldnames=CounterParser.ha_csv_header)

            values = [device_id]
            values.append(gputs)
            if OPT_compute == 1:
                values.append(seq)
                values.append(corr)

            values.append(0)
            for i in range(SUPTI_DEVICE_COUNT_MAX):
                port = self.gpuTopology.getPort(device_id, i)
                #print("gpu%d->gpu%d, port=%d" % (device_id, i, port))
                if port == 0 :
                    values.append(0)
                    pass
                else:
                    init_read = unpack('<Q', contents[(port-1)*8*4:(port-1)*8*4+8])[0]
                    tgt_write = unpack('<Q', contents[(port-1)*8*4+8*3:(port-1)*8*4+8*4])[0]
                    values.append((init_read + tgt_write)*64)
                    #print("init_read=%d, tgt_write=%d" % (init_read, tgt_write))
            values.append(0)
            for i in range(SUPTI_DEVICE_COUNT_MAX):
                port = self.gpuTopology.getPort(device_id, i)
                #print("gpu%d->gpu%d, port=%d" % (device_id, i, port))
                if port == 0 :
                    values.append(0)
                    pass
                else:
                    #print("init_read=%d, tgt_write=%d" % (init_read, tgt_write))
                    tgt_read = unpack('<Q', contents[(port-1)*8*4 +8*2:(port-1)*8*4+8*3])[0]
                    init_write = unpack('<Q', contents[(port-1)*8*4+8*1:(port-1)*8*4+8*2])[0]
                    values.append((tgt_read + init_write)*64)
            dic = dict(zip(CounterParser.ha_csv_header, values))
            #print(dic)
            writer.writerow(dic)
            pass
        pass
    def parse_topo(self, gputs, contents, corr, seq, grp, length, device_id):
        print('parse gpu topology...')
        self.gpuTopology = GpuTopology(contents)
        pass
    def parse_unkown(self, gputs, contents, corr, seq, grp, length, device_id):
        print('Got unkown couters[corr:%d, seq:%d]...' % (corr, seq))
        pass

def main():
    if len(sys.argv) < 2:
        print('''usage:
        {0} <input file>'''.format(sys.argv[0]))
        sys.exit()

    opts, args = getopt.getopt(sys.argv[1:], 'pc', ['pair', 'compute'])
    for opt,opt_val in opts:
        if opt in ('-p', '--pair'):
            OPT_pair = 1
        if opt in ('-c', '--compute'):
            OPT_compute = 1

    fname = args[0]
    with open(fname, 'rb') as fin:
        while True:
            header_size = 32
            head_bytes = fin.read(header_size)
            if head_bytes :
                header_size = int.from_bytes(head_bytes[24:28],"little") - header_size
                if (header_size > 0) :
                    head_bytes += (fin.read(header_size))
            else :
                break
            header = HeaderParser(head_bytes)
            #print('seq:%d' % header.seqid);
            parser = CounterParser()
            if not header.is_valid():
                print('Error header signature!')

            else:
                size = header.get_body_size()
                body_bytes = fin.read(size)
                body_type = header.type_to_string()
                attr = 'parse_' + body_type
                if hasattr(parser, attr):
                    fptr = getattr(parser, attr)
                    fptr(header.gputs_low, body_bytes, header.corrid, header.seqid, header.group_id, header.body_size, header.device_id)

if __name__ == '__main__':
    main()

