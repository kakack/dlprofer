import json
import os

def get_global_tc(folder='./'):
    # first,we get all csv file
    all_csv_file=[]
    pathDir =  os.listdir(folder)
    for allDir in pathDir:
        child = os.path.join(folder, allDir)
        if '.csv' in child:
            all_csv_file.append(child)
    #print(all_csv_file)
    # get the dict{corrID:is_use_tensor_core}
    is_use_tc={}
    for file in all_csv_file:
        corrID = int(file.split('/')[-1].split('_')[0])
        with open(file) as f: 
            for line in f:
                if 'tcore_cycles_active' in line:
                    tc_count = int(line.split(',')[-1])
                    is_use_tensor_core = bool(tc_count)
                    is_use_tc[corrID] = is_use_tensor_core
                    break # we only get spc 0 result and break
    return is_use_tc

is_use_tc = get_global_tc('./')

def parse_log(logpath='./suprof_event-92757.log'):
    '''
    parse supti log
    return  
    '''
    def _getname(c):
        return c.strip().strip('}').strip('{').split('kernelname:')[-1].split(',')[0].strip()
    def _funcname(b):
        return b.split()[-2]
    def _gettime(a):
        return float(a.split()[-1])
    def _getcorrID(a):
        return int(a.strip().strip('[').strip(']').split()[0])
    def _getdur(c):   
        return float(c.strip().strip('}').strip('{').split('dur:')[1].split(',')[0].strip())  # ms

    flag=False
    with open(logpath,'r') as f:
        kernelname_time_dict={}
        kernelname_call_dict={}
        kernelname_usetc_dict={}
        corrID_kernelname_dict={}
        kernelnames_time_list = []
        corrID_time_dict = {}
        corrID_list = []
        for idx,line in enumerate(f):
            result=line.split(']')
            if len(result)<3:
                a = result[0]
                c = line.split('{')[-1]
                corrID = _getcorrID(a)
                
                if corrID in corrID_list and 'dur:' in c:
                    corrID_time_dict[corrID] = _getdur(c)/1000.0 #convert to s
                    
                    kernelname = corrID_kernelname_dict.get(corrID,None)
                    
                    kernelname_time_dict[kernelname] = kernelname_time_dict.get(kernelname,0) + _getdur(c)/1000.0
            else:
                a,b = result[0],result[1]
                c=line.split('{')[-1]
                if 'kernelname' in c and 'ENTER' in c and not flag and _getname(c) and _getname(c)!='NoName':
                    kernelname = _getname(c)
                    
                    
                    corrID = _getcorrID(a)
                    

                    corrID_kernelname_dict[corrID] = kernelname

                    
                    corrID_list.append(corrID)
                    kernelname_usetc_dict[kernelname] = int(is_use_tc.get(corrID,False))
                    flag =True
                elif 'EXIT' in c and flag:
                    
                    corrID = _getcorrID(a)
                    kernelname = corrID_kernelname_dict.get(corrID,None)
                
                    
                    kernelname_call_dict[kernelname] = kernelname_call_dict.get(kernelname,0)+1

                    flag=False
                    #     import sys
                    #     sys.exit()

    for corrID in corrID_list:
        kernelnames_time_list.append(corrID_time_dict[corrID])
    for kernel in kernelname_time_dict:
        kernelname_time_dict[kernel] = kernelname_time_dict[kernel] / kernelname_call_dict[kernel] 
    #print(kernelname_time_dict,'\n',kernelname_call_dict)
    return kernelname_time_dict,kernelname_call_dict,kernelname_usetc_dict,kernelnames_time_list

def parse_gpu_utilization(logpath='./suprof_event-92757.log'):
    gpu_num=1
    with open(logpath,'r') as f:
        sum_gpu_time=0
        count =0 
        for line in f:
            if ' dur:' in line:
                gpu_time = float(line.split(' dur:')[-1].split(',')[0]) # ms
                #print(gpu_time)
                sum_gpu_time = sum_gpu_time+gpu_time
            if 'TIMESYNC' in line:
                count=count+1
                if count==5*gpu_num:
                    start_time= float(line.split(']')[0].split()[-1])
                if count==5*gpu_num+1:
                    end_time= float(line.split(']')[0].split()[-1])

    total_time =end_time-start_time
    #print(sum_gpu_time)
    #print(total_time)
    return(sum_gpu_time/1000/total_time)

def parse_performace_summary(logpath='./suprof_event-92757.log'):
    # to get iter_count and avg_iter_time
    def _getname(c):
        return c.strip().strip('}').strip('{').split('kernelname:')[-1].split(',')[0].strip()

    def _gettime(a):
        return float(a.split()[-1])

    with open(logpath,'r') as f:
        output=[]
        for idx,line in enumerate(f):
            result=line.split(']')
            if len(result)<3:
                continue
            else:
                a,b=result[0],result[1]
                c=line.split('{')[-1]
            if 'kernelname' in c and  _getname(c) and _getname(c)!='NoName':
                first_kernelname = _getname(c) # get the first kernelname 
                start_time = _gettime(a)*10**9
                break

    iter_count = 0
    gpu_num =1 
    count_for_endtime =0 
    with open(logpath,'r') as f:            
        for idx,line in enumerate(f):
            result=line.split(']')
            if len(result)<3:
                continue
            else:
                a,b=result[0],result[1]
                c=line.split('{')[-1]
                
            if 'kernelname' in c and _getname(c) and _getname(c)!='NoName':
                kernelname = _getname(c) # get the kernelname 
                if kernelname == first_kernelname:
                    iter_count = iter_count+1  

            if 'TIMESYNC' in line:
                count_for_endtime = count_for_endtime+1
                
                # if count_for_endtime==5*gpu_num:
                #     start_time= float(line.split(']')[0].split()[-1])
                if count_for_endtime==5*gpu_num+1:
                    end_time = _gettime(a)* 10**9

    return iter_count,(end_time-start_time)/iter_count

def parse_iteration_kernels(logpath='./suprof_event-92757.log'):
    '''
    this is function trying to get
    'iter_value', 'op_node_name', 'kernel_name', 'device_id', 
    'kernel_timestamp', 'kernel_duration', 'uses_tc', 'grid', 'block'      
    '''

    def _getname(c):
        return c.strip().strip('}').strip('{').split('kernelname:')[-1].split(',')[0].strip()
    def _getgrid(c):
        return c.strip().strip('}').strip('{').split('gdim:')[-1].split('bdim:')[0].strip().strip(',')        
    def _getblock(c):
        return c.strip().strip('}').strip('{').split('bdim:')[-1].strip()
        

    def _getdevice(b):
        return int(b.split()[-1])

    def _gettime(a):
        return float(a.split()[-1])
    def _getcorrID(a):
        return int(a.strip().strip('[').strip(']').split()[0])
    
    first_kernelname=''
    iter_value=-1
    with open(logpath,'r') as f:
        output=[]
        for idx,line in enumerate(f):
            result=line.split(']')
            if len(result)<3:
                continue
            else:
                a,b=result[0],result[1]
                c=line.split('{')[-1]
            if 'kernelname' in c and  _getname(c) and _getname(c)!='NoName':
                first_kernelname = _getname(c) # get the first kernelname 
                clip_time = int(_gettime(a))
                break
    _,_,_,kernelnames_time_list=parse_log(logpath)
    offset = 0 
    with open(logpath,'r') as f:            
        for idx,line in enumerate(f):
            result=line.split(']')
            if len(result)<3:
                continue
            else:
                a,b=result[0],result[1]
                c=line.split('{')[-1]
                
            if 'kernelname' in c and _getname(c) and _getname(c)!='NoName':
                kernelname = _getname(c) # get the kernelname 
                if kernelname == first_kernelname:
                    iter_value=iter_value+1    

                device_id = _getdevice(b)
                kernel_timestamp = (_gettime(a) -clip_time) * 10**9

                kernel_duration=kernelnames_time_list[offset] * 10**9 # convet s to ns
                offset=offset+1
                
                corrid = _getcorrID(a)
                uses_tc = int(is_use_tc.get(corrid,False))
                
                grid = _getgrid(c)
                block = _getblock(c)
                #print([grid,block])
                output.append([iter_value,kernelname,kernelname,device_id,kernel_timestamp,kernel_duration,uses_tc,grid,block])
    #print(output)
    return output

def parse_iteration_ops(logpath='./suprof_event-108799.log'):
    '''
    this is function trying to get
    'op id','op name','op type','total kernels','TC kernels'
    'total GPU Time','TC GPU Time','Data Type'
    '''
    kernel_info=parse_iteration_kernels(logpath) # now we take kernel as op,just a temporary solution
    output = [] 
    for idx,kernel in enumerate(kernel_info):
        iter_value=kernel[0]
        op_id = idx
        op_name = kernel[1]
        op_type = kernel[1] # just use kernel_name temporarily
        total_kernel = 1
        TC_kernel = kernel[6]
        gpu_time = kernel[5]
        TC_GPU_Time = kernel[5] if kernel[6]==1 else 0
        output.append([iter_value,op_id,op_name,op_type,total_kernel,TC_kernel,gpu_time,TC_GPU_Time,'todo'])
    return output

def parse_iteration_op_kernels(logpath='./suprof_event-108799.log'):
    '''
    this is function trying to get
    'iter_value', 'op_node_id', 'kernel_name', 'device_id', 
    'kernel_timestamp', 'kernel_duration', 'uses_tc', 'grid', 'block'      
    '''    
    kernel_info=parse_iteration_kernels(logpath) # now we take kernel as op,just a temporary solution
    output = []   

    for idx,kernel in enumerate(kernel_info):
        iter_value = kernel[0]
        op_id = idx  
        kernel_name = kernel[1]
        device_id = kernel[3]
        kernel_timestamp = kernel[4]
        kernel_duration =  kernel[5]
        uses_tc = kernel[6]
        grid = kernel[7]
        block = kernel[8]
        output.append([iter_value,op_id,kernel_name,device_id,kernel_timestamp,kernel_duration,uses_tc,grid,block])
    return output
def parse_iteration_summary(logpath='./suprof_event-108799.log'):
    '''
    this is function trying to get
    'iter', 'time', 'duration', 'total kernels', 
    'TC kernels', 'tc_duration' , 'non_tc_duration','memory_duration',dataloader_duration,'io_duration', 'cpu_duration', 'other_duration'     
    '''
    def _getname(c):
        return c.strip().strip('}').strip('{').split('kernelname:')[-1].split(',')[0].strip()
        
    def _getdevice(b):
        return int(b.split()[-1])

    def _gettime(a):
        return float(a.split()[-1])
    def _getcorrID(a):
        return int(a.strip().strip('[').strip(']').split()[0])

    iter_count,_= parse_performace_summary(logpath)
    _,_,_,kernelnames_time_list=parse_log(logpath)
    offset = 0

    first_kernelname=''    
    with open(logpath,'r') as f:
        
        for idx,line in enumerate(f):
            result=line.split(']')
            if len(result)<3:
                continue
            else:
                a,b=result[0],result[1]
                c=line.split('{')[-1]
            if 'kernelname' in c  and _getname(c) and _getname(c)!='NoName':
                first_kernelname = _getname(c) # get the first kernelname 
                clip_time = int(_gettime(a))
                break
    output_dict = {i:[0]*11  for i in range(iter_count)}
    count_for_endtime = 0
    gpu_num = 1
    iter_value=-1
    with open(logpath,'r') as f:            
        for idx,line in enumerate(f):
            if 'DMA' in line and iter_value >=0:
                io_duration = float(line.strip().split('{')[-1].strip().split('dur:')[-1].split(',')[0].strip())
                output_dict[iter_value][8] = io_duration *10**6 #io_duration,convert to ns
            result=line.split(']')
            if len(result)<3:
                continue
            else:
                a,b=result[0],result[1]
                c=line.split('{')[-1]
                
            if 'kernelname' in c and  _getname(c) and _getname(c)!='NoName':
                kernelname = _getname(c) # get the kernelname 
                if kernelname == first_kernelname:
                    iter_value=iter_value+1    
                    output_dict[iter_value][0] = (_gettime(a) - clip_time)* 10**9 # time, ns 
                    if iter_value!=0:
                        output_dict[iter_value-1][1] = output_dict[iter_value][0] - output_dict[iter_value-1][0]   # duration,ns

                output_dict[iter_value][2] = output_dict[iter_value][2]+1 #total kernels

                # get tc_duration and not_tc_duration
                corrid = _getcorrID(a)
                if is_use_tc.get(corrid,False):
                    output_dict[iter_value][3] = output_dict[iter_value][3] +1 #'TC kernels'
                    output_dict[iter_value][4] = output_dict[iter_value][4] + kernelnames_time_list[offset] * 10**9  #'tc_duration' 
                elif not is_use_tc.get(corrid,False):
                    output_dict[iter_value][5] = output_dict[iter_value][5] + kernelnames_time_list[offset] * 10**9  #'non_tc_duration'
                offset=offset+1

            if  'sudrvMemcpy' in b and 'ENTER' in c:
                start_mem_time = _gettime(a)
            elif  'sudrvMemcpy' in b and 'EXIT' in c and iter_value>=0:
                end_mem_time = _gettime(a)
                print('end_mem_time',end_mem_time)
                output_dict[iter_value][6] = (end_mem_time-start_mem_time) * 10**6 #memory_duration

            if 'TIMESYNC' in line:
                count_for_endtime = count_for_endtime+1
                
                # if count_for_endtime==5*gpu_num:
                #     start_time= float(line.split(']')[0].split()[-1])
                if count_for_endtime==5*gpu_num+1:
                    end_time = ( _gettime(a) - clip_time)* 10**9
                    
        
        output_dict[iter_value][1] = end_time - output_dict[iter_value][0] # duration  
    for iter in output_dict:
        output_dict[iter][10] = output_dict[iter][1] -sum(output_dict[iter][4:10])  # 'other_duration'
    
    return output_dict

def parse_resourceUsage_breakdown(logpath):
    # get us_tc,not_use_tc,memory,dataloader,I/O,CPU,other duration percent
    iteration_info_dict =parse_iteration_summary(logpath)
    print('iteration_summary:',iteration_info_dict)
    sum_every_dur = [0]*7
    for iter,info in iteration_info_dict.items():
        sum_every_dur = [x+y for x,y in zip(info[4:11],sum_every_dur)]
    
    sum_time= sum(sum_every_dur)
    percent_every_dur = [i/sum_time*100 for i in sum_every_dur]
    
    return percent_every_dur

def parse_kernel_summary(logpath):
    # get 'total_gpu_time', 'total_count', 'using_tc_gpu_time', 'using_tc_count', 'memory_gpu_time', 'memory_count', 'other_gpu_time', 'other_count'
    # for Total Kernel GPU Time in dlprof
    iteration_info_dict =parse_iteration_summary(logpath)
    sum_every_item = [0]*11
    for iter,info in iteration_info_dict.items():
        sum_every_item = [x+y for x,y in zip(info,sum_every_item)]
    
    #'time', 'duration', 'total kernels', 
    #'TC kernels', 'tc_duration' , 'non_tc_duration','memory_duration'    for sum_every_item
    total_gpu_time= sum_every_item[4] +sum_every_item[5] 
    total_count = sum_every_item[2]
    using_tc_gpu_time = sum_every_item[4] 
    using_tc_count = sum_every_item[3]
    memory_gpu_time = 0
    memory_count = 0 
    other_gpu_time = sum_every_item[5]
    other_count = total_count-using_tc_count

    output = [total_gpu_time,total_count,using_tc_gpu_time,using_tc_count,memory_gpu_time,memory_count,other_gpu_time,other_count]
    print('kernel_summary',output)
    return output

if __name__=='__main__':
    print(is_use_tc)
    #print (parse_iteration_kernels(logpath='./suprof_event-108799.log'))

