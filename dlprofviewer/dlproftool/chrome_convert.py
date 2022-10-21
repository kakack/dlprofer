#!/usr/bin/env python3

import sys 
import os 
import re 
from struct import *
import csv
import shutil
import getopt

class ActivityRecord: 
    def __init__(self): 
        self.pid = 'default' 
        self.tid ='default' 
        self.name = '' 
        self.ts = 0 
        self.ph = '' 
        self.cat = 'SUPA' 
        self.args = '' 
        self.core = '' 
        self.dur = '' 
        self.stack = ''



def cal_regression(re_path):

    f_ca = open(re_path)
    global flag_err_dict
    global regre_a_dict
    global regre_b_dict
    global cal_time_dict
    global l_gputs_dict
    global l_cputs_dict


    SUM_CTS = {}
    for index_sc in range(0,8):
        SUM_CTS['sum_cts_'+str(index_sc)] = 0

    SUM_GTS = {}
    for index_sg in range(0,8):
        SUM_GTS['sum_gts_'+str(index_sg)] = 0

    SUM_S = {}
    for index_s in range(0,8):
        SUM_S['sum_s_'+str(index_s)] = 0

    SUM_M = {}
    for index_m in range(0,8):
        SUM_M['sum_m_'+str(index_m)] = 0
    
    while True:
        lines = f_ca.readlines(20) #?
        if not lines: 
            break 
        for line in lines:
            
            if len(line) < 5: 
                continue 
            if line.split()[2] == 'TIMESYNC':  #line.split()[1]: Converts a string to a list by spacing,and,get number 1 element
                dev_id = line.split()[6].split(']')[0]
                sps = line.split(']', 2)
                part3 = sps[2][:]
                pse = part3.split('[', 1)
                pse_part = pse[1].split(',',1)
                pse_part1 = pse_part[1].split(']',1)
                l_cputs_dict['l_cputs_'+dev_id].append(float(pse_part[0]))
                l_gputs_dict['l_gputs_'+dev_id].append(float(pse_part1[0]))

                sync_times = 5
                for index_IF in range(0,8):  #check every gpu
                    if len(l_cputs_dict['l_cputs_'+str(index_IF)]) ==  sync_times:
                        if cal_time_dict['cal_time_'+str(index_IF)] == 0: #every gpu just calculate one time
                            cal_time_dict['cal_time_'+str(index_IF)] = 1

                            for ic in l_cputs_dict['l_cputs_'+str(index_IF)]:
                                SUM_CTS['sum_cts_'+str(index_IF)] = SUM_CTS['sum_cts_'+str(index_IF)] + ic
                            for ig in l_gputs_dict['l_gputs_'+str(index_IF)]:
                                SUM_GTS['sum_gts_'+str(index_IF)] = SUM_GTS['sum_gts_'+str(index_IF)] + ig
                            aver_cts = SUM_CTS['sum_cts_'+str(index_IF)] / sync_times
                            aver_gts = SUM_GTS['sum_gts_'+str(index_IF)] / sync_times
                            for index_no in range(0,sync_times):
                                SUM_S['sum_s_'+str(index_IF)] = SUM_S['sum_s_'+str(index_IF)] + (l_gputs_dict['l_gputs_'+str(index_IF)][index_no] - aver_gts) * (l_cputs_dict['l_cputs_'+str(index_IF)][index_no] - aver_cts)
                                SUM_M['sum_m_'+str(index_IF)] = SUM_M['sum_m_'+str(index_IF)] + (l_gputs_dict['l_gputs_'+str(index_IF)][index_no] - aver_gts) * (l_gputs_dict['l_gputs_'+str(index_IF)][index_no] - aver_gts)
                            if  SUM_M['sum_m_'+str(index_IF)] != 0:
                                regre_b_dict['regression_b_'+str(index_IF)] = SUM_S['sum_s_'+str(index_IF)] / SUM_M['sum_m_'+str(index_IF)]
                                regre_a_dict['regression_a_'+str(index_IF)] = aver_cts - (regre_b_dict['regression_b_'+str(index_IF)] * aver_gts)
                                print('Card [ ' +str(index_IF) + ' ] Regression calculate done!')
                            else:
                                print('Card [ ' +str(index_IF) +' ] ZeroDivisionError!')
                                flag_err_dict['flag_error_'+str(index_IF)] = 1

    f_ca.close()

def handleHost(line): 
    global last_ts
    global time_flag
    global firstTsRecord
    global pid_flag
    global temp_pid #Not to declare global variables, but to avoid errors
    global kernelname_dict
    

    act = ActivityRecord()
    sps = line.split(']', 2) 
    part1 = sps[0][1:] 
    part2 = sps[1][1:] 
    part3 = sps[2][:] 
    spp1 = part1.split() 
    spp2 = part2.split() 

    act.cat = '\"' + spp1[1] + '\"' 

    # "ts" starts at "0" 
    if time_flag == 0:
        if directore_ornot_flag == 0:
            firstTsRecord = float(spp1[3])
            temTs = 0
        else:
            firstTsRecord = global_startTS
            temTs = float(spp1[3]) - float(firstTsRecord)
            #print('firstTsRecord : ',firstTsRecord)
        
        time_flag = 1
    else:
        temTs = float(spp1[3]) - float(firstTsRecord)

    act.ts = str(int(float(temTs) * 1000000)) 

    if act.ts:
        last_ts = act.ts 
    
    act.tid = spp2[0].split('-')[-1]

    #pid -> Host_xxx
    if pid_flag == 0:
        temp_pid = str(act.tid)
        pid_flag = 1

    act.pid = '\"' + 'HOST_' + temp_pid + '\"'

    act.core = '\"' + spp2[1] + '\"' 
    act.name = '\"' + spp2[2] + '\"' 

    if re.search('site:.*ENTER', part3): 
        act.ph = '\"B\"' 
    elif  re.search('site:.*EXIT', part3): 
        act.ph = '\"E\"' 
    else: 
        act.ph = '\"X\"' 
        act.dur = '1000' 
    tmp_args =  part3[1:-2]  
    tmp_args1 = tmp_args.replace(':', '\":\"') 
    tmp_args2 = tmp_args1.replace('{', '{\"') 
    tmp_args3 = tmp_args2.replace('}', '\"}') 
    tmp_args4 = tmp_args3.replace(',', '\",\"') 
    act.args = tmp_args4

    if re.search('chain:', part3): 
        first = part3.find('[')
        last = part3.rfind(']')
        cont = part3[first +1:last]
        cont = cont.replace(" ,","\",\"")
        cont = '\"' + cont + '\"'
        
        act.stack = '[' + cont +']' 
    
    # add 'size' to args
    if re.search('size:',part3) or re.search('kernelname',part3):
        temp_1 = part3.replace(' ','')
        if re.search('=',part3):
            temp_2 = temp_1.replace('=',':')
        else:
            temp_2 = temp_1
        if  re.search('gdim',part3):
            loca =  temp_2.rfind(',gdim')
            tt = temp_2[:loca]
            temp_2 = tt + '}'
        temp_3 = temp_2.replace(':', '\":\"')
        temp_4 = temp_3.replace('{', '{\"')
        temp_5 = temp_4.replace('}', '\"}') 
        temp_6 = temp_5.replace(',', '\",\"')    
        temp_7 = eval(temp_6)
        
        if re.search('size:',part3):
            cont_tmp = '\"'+'size' + '\"' + ':' + '\"' + temp_7['size'] + '\"'
            act.stack = '{' + cont_tmp  + '}'
        if re.search('kernelname',part3):
            kernelname_dict[spp1[0]] = temp_7['kernelname'] 
            
    out_line = '{ \"name\" : ' + act.name 
    out_line += ', \"cat\" : ' + act.cat 
    out_line += ', \"pid\" : ' + act.pid 
    out_line += ', \"tid\" : ' + act.tid 
    out_line += ', \"ts\" : ' + act.ts 
    out_line += ', \"ph\" : ' + act.ph 
    if act.ph == '\"X\"': 
        out_line += ', \"dur\" : ' + act.dur 
    if act.stack: 
        out_line += ', \"args\" : ' + act.stack 
    #out_line += ', \"args\" : ' + act.args 
    out_line += '},\n' 
    global f_wr
    f_wr.write(out_line)

def handleDevice(line): 
    global last_ts
    global regre_a_dict
    global regre_b_dict
    global firstTsRecord
    global time_flag
    global tmp_lines
    global temp_pid
    global kernelname_dict
    global global_startTS

    act = ActivityRecord() 
    sps = line.split(']', 1) 
    part1 = sps[0][1:] 
    part2 = sps[1][:] 
    spp1 = part1.split() 

    act.pid = '\"' +'DEVICE'+ '(' + temp_pid + ')' + '\"' 

    correction_ID = spp1[0]
    args_corrId = '\"'+'correction_ID' + '\"' + ':' + '\"' + correction_ID + '\"'
    act.stack = '{' + args_corrId  + '}'

    part1_xx = part1.split()[3]

    act.tid = '\"' + 'device' + part1_xx + '_' + spp1[2] + '\"'

    #Synchronize the CPU time with gpu time
    tmp1 = part2.replace(' ','')
    tmp2 = tmp1.split(':',1)
    tmp3 = tmp2[1].split(',',1)
    Gputs = float(tmp3[0])
    if Gputs == 0:
        return
    device_id = part1.split()[3]

    if flag_err_dict['flag_error_'+device_id] == 0:
        CputsFromGputs = regre_b_dict['regression_b_'+device_id] * Gputs + regre_a_dict['regression_a_'+device_id]
        if time_flag == 1:
            temTs_D = CputsFromGputs - float(firstTsRecord)
            act.ts = str(int(float(temTs_D) * 1000000))
        else:
                act.ts = last_ts
    else:
        act.ts = last_ts

    act.ph = '\"X\"'
    #act.name = act.tid
    #act.name = '\"' +  spp1[2] + '\"'

    if spp1[0] in kernelname_dict:
        if nocorrection_flag == 1:
            act.name = '\"' + kernelname_dict[spp1[0]] + '\"'
        else:
            act.name = '\"' + kernelname_dict[spp1[0]] + ':' + correction_ID + '\"'
        kernelname_dict.pop(spp1[0])
    else:
        if nocorrection_flag == 1:
            act.name = '\"' +  spp1[2] + '\"'
        else:
            act.name = '\"' +  spp1[2] + ':' + correction_ID + '\"'
    
    act.cat = act.tid
    tmp_args0 = part2.replace(' ','')
    tmp_args = tmp_args0.replace('=',':')
    tmp_args1 = tmp_args.replace(':', '\":\"') 
    tmp_args2 = tmp_args1.replace('{', '{\"') 
    tmp_args3 = tmp_args2.replace('}', '\"}') 
    tmp_args4 = tmp_args3.replace(',', '\",\"') 
    json_args = eval(tmp_args4)  # str -> dict
    act.dur = str(int(float(json_args['dur']) * 1000)) #'dur' --key
    #act.ts = str((json_args['gputs']))
    out_line = '{ \"name\" : ' + act.name 
    out_line += ', \"cat\" : ' + act.cat 
    out_line += ', \"pid\" : ' + act.pid 
    out_line += ', \"tid\" : ' + act.tid 
    out_line += ', \"ts\" : ' + act.ts 
    out_line += ', \"ph\" : ' + act.ph 
    out_line += ', \"dur\" : ' + act.dur 
    out_line += ', \"args\" : ' + act.stack
    out_line += '},\n' 
    tmp_lines += out_line #put 'DEVICE' last in chrome://tracing

#single process :
def single_process(p_dir):
    global time_flag
    global last_ts
    global flag_err_dict
    global regre_a_dict
    global regre_b_dict
    global cal_time_dict
    global l_gputs_dict
    global l_cputs_dict
    global pid_flag
    global tmp_lines


    if p_dir.split('.')[-1] == 'log':

        f_rd = open(p_dir)
        
        cal_regression(p_dir)
        while True: 
            lines = f_rd.readlines(20) #?
            if not lines:
                break 
            for line in lines:
                #print('lines: ' + line)
                if len(line) < 5: 
                    continue 
                if line.split()[1] != 'DEVICE':  #line.split()[1]: Converts a string to a list by spacing,and,get number 1 element
                    handleHost(line)
                else: 
                    handleDevice(line)

        #The zero flag bit is cleared in preparation for parsing the next file
        last_ts = ''
        time_flag = 0
        pid_flag = 0
        temp_pid = ''

        flag_err_dict = {}
        for index_FE in range(0,8):
            flag_err_dict['flag_error_'+str(index_FE)] = 0

        regre_a_dict ={}
        for index_RA in range(0,8):
            regre_a_dict['regression_a_'+str(index_RA)] = 0

        regre_b_dict ={}
        for index_RB in range(0,8):
            regre_b_dict['regression_b_'+str(index_RB)] = 0

        cal_time_dict = {}
        for index_CT in range(0,8):
            cal_time_dict['cal_time_'+str(index_CT)] = 0

        l_gputs_dict = {}
        for index_LG in range(0,8):
            l_gputs_dict['l_gputs_'+str(index_LG)] = []

        l_cputs_dict = {}
        for index_LC in range(0,8):
            l_cputs_dict['l_cputs_'+str(index_LC)] = []

        f_rd.close()

        #ActivityRecord() 

        print(p_dir + ' convert done')


def main():
    global time_flag
    global last_ts
    global flag_err_dict
    global regre_a_dict
    global regre_b_dict
    global cal_time_dict
    global l_gputs_dict
    global l_cputs_dict
    global tmp_lines
    global firstTsRecord
    global pid_flag
    global temp_pid  # Not to declare global variables, but to avoid errors
    global kernelname_dict
    global f_wr

    if len(sys.argv) < 2:
        print('usage: ' + sys.argv[0] + ' <log file>')
        sys.exit()

    # log_flag indicates whether a log file exists
    global log_flag
    log_flag = 0

    # -c ?
    global compare_flag
    compare_flag = 0

    # -d ?
    global nocorrection_flag
    nocorrection_flag = 0

    # check log
    global compare_log_flag
    compare_log_flag = 0

    global directore_ornot_flag
    directore_ornot_flag = 0

    global global_startTS
    global_startTS = 0

    global MinTsRecord
    MinTsRecord = 0

    tmp_name = ''

    optsch, argsch = getopt.getopt(sys.argv[1:], 'cn', ['compare', 'nocoor'])

    for opt, opt_val in optsch:
        if opt in ('-c', '--compare'):
            compare_flag = 1
        if opt in ('-n', '--nocoor'):
            nocorrection_flag = 1

    if compare_flag == 1:
        for check_log in argsch:
            if check_log.split('.')[-1] != 'log':
                print('usage: ' + sys.argv[0] + ' -c' + ' <log file1>' + ' ... ' + ' <log file2>')
                compare_log_flag = 1
                break
        if compare_log_flag == 0:
            # print('test')
            log_flag = 1
            for file_name in argsch:
                # tid_1 = file_name.split('.')[0]
                # tid_2 = tid_1.split('-')[-1]
                fir_loca = file_name.find('-')
                las_loca = file_name.rfind('.')
                tmp_name = tmp_name + '_' + file_name[fir_loca + 1:las_loca]
            wr_path = 'compare' + tmp_name
    else:
        # Checking if it's a file
        if os.path.isfile(argsch[0]):  # file
            if argsch[0].split('.')[-1] == 'log':
                log_flag = 1
                wr_path = argsch[0]
        else:  # directory path
            # Read multiple files from a folder
            directore_ornot_flag = 1

            dp = [d for d in os.listdir(argsch[0])]
            for fi in dp:
                path_fi = str(argsch[0]) + '/' + fi
                if path_fi.split('.')[-1] == 'log':
                    log_flag = 1
                    f_rd = open(path_fi)
                    line_fi = f_rd.readline()  # ?
                    sps_fi = line_fi.split(']', 2)
                    part1_fi = sps_fi[0][1:]
                    spp1_fi = part1_fi.split()
                    MinTsRecord = float(spp1_fi[3])
                    # print(' 111 MinTsRecord : ',MinTsRecord)
                    wr_path = 'multi_process'
                    f_rd.close()
                    break

            dp_Sst = [d_Sst for d_Sst in os.listdir(argsch[0])]
            if log_flag == 1:
                for file_Sst in dp_Sst:
                    path_Sst = str(argsch[0]) + '/' + file_Sst
                    if path_Sst.split('.')[-1] == 'log':
                        f_rd = open(path_Sst)
                        line_Sst = f_rd.readline()  # ?
                        # print('line_Sst : ',line_Sst)
                        sps_Sst = line_Sst.split(']', 2)
                        part1_Sst = sps_Sst[0][1:]
                        spp1_Sst = part1_Sst.split()
                        # print('float(spp1_Sst[3]) : ',float(spp1_Sst[3]))
                        # print('MinTsRecord : ',MinTsRecord)
                        if MinTsRecord > float(spp1_Sst[3]):
                            MinTsRecord = float(spp1_Sst[3])

                        f_rd.close()

                global_startTS = MinTsRecord
                print('global_startTS : ', global_startTS)

    if log_flag == 1:
        f_wr = open(wr_path + '-out.json', 'w')  ###?
        print('ouput file: ' + wr_path + '-out.json')
        f_wr.write('[\n')

    last_ts = ''
    time_flag = 0
    pid_flag = 0
    tmp_lines = ''
    temp_pid = ''

    flag_err_dict = {}
    for index_FE in range(0, 8):
        flag_err_dict['flag_error_' + str(index_FE)] = 0

    regre_a_dict = {}
    for index_RA in range(0, 8):
        regre_a_dict['regression_a_' + str(index_RA)] = 0

    regre_b_dict = {}
    for index_RB in range(0, 8):
        regre_b_dict['regression_b_' + str(index_RB)] = 0

    cal_time_dict = {}
    for index_CT in range(0, 8):
        cal_time_dict['cal_time_' + str(index_CT)] = 0

    l_gputs_dict = {}
    for index_LG in range(0, 8):
        l_gputs_dict['l_gputs_' + str(index_LG)] = []

    l_cputs_dict = {}
    for index_LC in range(0, 8):
        l_cputs_dict['l_cputs_' + str(index_LC)] = []

    kernelname_dict = {}

    if compare_flag == 1:
        if compare_log_flag == 0:
            for cp_file in argsch:
                single_process(cp_file)
    else:
        #Read multiple files from a folder
        if os.path.isfile(argsch[0]):                   #file
            single_process(argsch[0])
        else:
            dp = [d for d in os.listdir(argsch[0])]     #directory
            for fi in dp:
                path = str(argsch[0])+ '/' + fi
                single_process(path)

    if log_flag == 1:
        f_wr.write(tmp_lines)  #put 'DEVICE' last in chrome://tracing
        f_wr.write('{\"name\" : \"end\"}]\n')
        f_wr.close()
        print("Conversion done.")
    else:
        if compare_flag == 1:
              print('A non-log file exists')
        else:
            print("no log file!")

if __name__ == '__main__':
    main()