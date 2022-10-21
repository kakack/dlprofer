import sys
import os
import pkg_resources
import sqlite3
from parse_supti import parse_log,parse_gpu_utilization,parse_performace_summary,parse_iteration_kernels,\
parse_iteration_summary,parse_iteration_ops,parse_iteration_op_kernels,parse_resourceUsage_breakdown,\
parse_kernel_summary

dlproftool_path = pkg_resources.resource_filename(
        'dlprofviewer', 'dlproftool')
# sys.path.append(dlproftool_path)
database_path = os.path.join(dlproftool_path, 'dlprof_dldb.sqlite')
con = sqlite3.connect(database_path)
cur = con.cursor()

def deal_viewop(logpath="./suprof_event-92757.log"):

    #cur.execute("select name from sqlite_master where type='table' order by name")
    #cur.fetchall() # get all table name

    cur.execute('CREATE TABLE if not exists my_view_op_nodes as SELECT * FROM  view_op_nodes')
    cur.execute("DELETE FROM my_view_op_nodes")
    #['aggr_id', 'domain_name', 'gpu_time', 'cpu_time', 'op_node_name', 'direction', 'op_node_type', 'num_calls', 'tc_eligible', 'using_tc', 'kernel_calls', 'is_bad_data_type', 'data_type', 'stack_trace', 'op_node_id']

    kernelname_time_dict,kernelname_call_dict,kernelname_usetc_dict,_ = parse_log(logpath)

    padding_column=[1,u'default-domain',0,0,u'b',u'',u'Const',1,0,0,0,0,u'',u'',u'CONST_1']

    idx = 0
    for key,value in kernelname_time_dict.items():
        padding_column[2] = value*10**9 # 'gpu_time'
        padding_column[4] = key #'op_node_name
        padding_column[6] = key #'op_node_type 
        padding_column[7] = kernelname_call_dict[key] #num_calls
        padding_column[8] = kernelname_usetc_dict[key] #temporarily solution ,todo:tc_eligible
        padding_column[9] = kernelname_usetc_dict[key] #using_tc
        padding_column[10] = kernelname_call_dict[key] #kernel_calls
        padding_column[12] = 'todo' #data_type
        padding_column[14] = 'node_id_'+str(idx) #view_id
        idx+=1
        cur.execute("INSERT INTO my_view_op_nodes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", padding_column)

    cursor=cur.execute("select * from my_view_op_nodes")
    column_name=list(map(lambda x: x[0], cursor.description))
    #print(column_name)
    #print(cursor.fetchall())

    cur.execute('DROP VIEW view_op_nodes')
    cur.execute('CREATE VIEW view_op_nodes as select * from my_view_op_nodes')
    
    con.commit()

def deal_gpu_utilization(logpath="./suprof_event-108799.log"):

    cur.execute('CREATE TABLE if not exists my_view_domain_model_gpu_utilization as SELECT * FROM  view_domain_model_gpu_utilization')
    cur.execute("DELETE FROM my_view_domain_model_gpu_utilization")
    data=parse_gpu_utilization(logpath)
    padding_column=[1,u'default-domain',50]
    padding_column[2] = data*100
    cur.execute("INSERT INTO my_view_domain_model_gpu_utilization VALUES (?,?,?)", padding_column)
    
    cur.execute('DROP VIEW view_domain_model_gpu_utilization')
    cur.execute('CREATE VIEW view_domain_model_gpu_utilization as select * from my_view_domain_model_gpu_utilization')
    
    con.commit()

def deal_system_config(logpath="./suprof_event-108799.log"):
    
    
    cur.execute("create table if not exists my_table_system_config as select * from view_system_config")
    cursor = cur.execute("select * from my_table_system_config")
    column_name = list(map(lambda x: x[0], cursor.description))
    #print(column_name)
    if 'cuda_version' in column_name:
        print('cuda_version')
        cur.execute("ALTER TABLE my_table_system_config RENAME COLUMN 'cuda_version' to 'supa_version' ")
    if 'cudnn_version' in column_name:
        print('cudnn_version')
        cur.execute("ALTER TABLE my_table_system_config RENAME COLUMN 'cudnn_version' to 'sudnn_version' ")
    if 'nsys_version' in column_name:
        print('nsys_version')
        cur.execute("ALTER TABLE my_table_system_config RENAME COLUMN 'nsys_version' to 'susight_version' ")

    cur.execute("DELETE FROM my_table_system_config")

    
    padding_column=[1, '8', 'AMD EPYC 7742 64-Core Processor', '01.01.01', 'BRTensorFlow 0.1.0', '0.1', '0.1.0', '0.1.0', 'v1.8.0', '29839685', '', 
    'tensorflow1', '/usr/local/bin/dlprof --mode=tensorflow1 --force=true python test.py']
    
    cur.execute("INSERT INTO my_table_system_config VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", padding_column)
    
    cur.execute('DROP VIEW view_system_config')
    cur.execute('CREATE VIEW view_system_config as select * from my_table_system_config')

    # deal another view
    my_table_name='my_table_gpu_names'
    origin_view_name='view_gpu_names'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    padding_column = ['BR104-300W-32GB',]
    for i in range(8):
        cur.execute("INSERT INTO {} VALUES (?)".format(my_table_name), padding_column)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
   


    con.commit()

def deal_performance_summary(logpath="./suprof_event-108799.log"):
    my_table_name='my_table_performance_summary'
    origin_view_name='view_performance_summary'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    padding_column = [1, 'default-domain', 1807831836, 0.0, 0.0, 1, 1, 0, 0, 1807831836.0, 'global_step']
    
    iter_count,avg_time = parse_performace_summary(logpath)
    gpu_utilization = parse_gpu_utilization(logpath)
    print('gpu_utilization',gpu_utilization)
    #['aggr_id', 'domain_name', 'wall_clock_time', 'tc_utilization', 'gpu_utilization', 'total_iterations', 'profiled_iterations', 'iter_start', 'iter_stop', 'iter_avg', 'key_node']
    padding_column[9] = avg_time
    padding_column[8] = iter_count-1 #iter_end    
    padding_column[7] = 0 #iter_start
    padding_column[6] = iter_count # profiled_iterations
    padding_column[5] = iter_count # total_iterations
    padding_column[4] = gpu_utilization*100 #gpu_utilization
    padding_column[2] = avg_time*iter_count #wall_clock_time

    cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?,?,?)".format(my_table_name), padding_column)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()   

def deal_GPU_Utilizations(logpath="./suprof_event-108799.log"):
    my_table_name='my_table_gpu_devices'
    origin_view_name='view_gpu_devices'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    padding_column = [1, 'default-domain', 0, 'A100-SXM4-40GB', 8, 0, 108, 0.0]
    #['aggr_id', 'domain_name', 'device_id', 'gpu_name', 'cuda_major', 'cuda_minor', 'sm_count', 'device_gpu_utilization']
    
    gpu_utilization = parse_gpu_utilization(logpath) # todo: for multi-gpu-process， get the gpu utilization for 8 gpu
    print('gpu_utilization',gpu_utilization)

    for i in range(8):
        padding_column[2] = i 
        padding_column[3] = 'BR104-300W-32GB'
        if i==0:
            padding_column[7] = gpu_utilization *100 # for percent
        else:
            padding_column[7] = 0

        cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?)".format(my_table_name), padding_column)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()   

def deal_iteration_kernels(logpath="suprof_event-108799.log"):
    
    my_table_name='my_table_iteration_kernels'
    origin_view_name='view_iteration_kernels'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    #['aggr_id', 'domain_name', 'iter_value', 'op_node_name', 'kernel_name', 'device_id', 
    # 'kernel_timestamp', 'kernel_duration', 'uses_tc', 'grid', 'block']

    data= parse_iteration_kernels(logpath)

    for item in data:
        item = [1, 'default-domain']+item
        cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?,?,?)".format(my_table_name), item)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()       

def deal_iteration_summary(logpath="suprof_event-108799.log"):
    
    my_table_name='my_table_iterations_profiled'
    origin_view_name='view_iterations_profiled'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    #['aggr_id', 'domain_name', 'iter_value', 'start_time', 'duration', 'total_kernel_count', 'using_tc_kernel_count', 'tc_duration', 'non_tc_duration', 'memory_duration', 'dataloader_duration', 'io_duration', 'cpu_duration', 'other_duration']

    data_dict= parse_iteration_summary(logpath)
    
    for item in data_dict:
        item = [1, 'default-domain']+[item]+data_dict[item]
        cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)".format(my_table_name), item)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()     

def deal_iteration_op(logpath="suprof_event-108799.log"):
    
    my_table_name='my_table_iteration_ops'
    origin_view_name='view_iteration_ops'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    #['aggr_id', 'domain_name', 'iter_value', 'op_node_name', 'direction', 'op_node_type', 'total_count', 'tc_count', 'total_gpu_time', 'tc_gpu_time', 'data_type', 'stack_trace', 'op_node_id']

    data= parse_iteration_ops(logpath)
    
    for item in data:
        item = [1, 'default-domain']+item[0:1]+ item[2:3] + ['direction'] + item[3:9] +['stack_trace'] +  item[1:2]
        cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)".format(my_table_name), item)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()       

def deal_iteration_op_kernels(logpath="suprof_event-108799.log"):
    
    my_table_name='my_table_iteration_op_kernels'
    origin_view_name='view_iteration_op_kernels'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    #['aggr_id', 'domain_name', 'iter_value', 'op_node_id', 'kernel_name', 'device_id', 'kernel_timestamp', 'kernel_duration', 'uses_tc', 'grid', 'block']

    data= parse_iteration_op_kernels(logpath)
    
    for item in data:
        item = [1, 'default-domain']+item
        cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?,?,?)".format(my_table_name), item)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()    

def deal_resource_usage_breakdown(logpath="suprof_event-108799.log"):
    
    my_table_name='my_table_resource_usage_breakdown'
    origin_view_name='view_resource_usage_breakdown'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    #['aggr_id', 'domain_name', 'tc_duration_pct', 'non_tc_duration_pct', 'memory_duration_pct', 'dataloader_duration_pct', 'io_duration_pct', 'cpu_duration_pct', 'other_duration_pct']

    data= parse_resourceUsage_breakdown(logpath)
    

    item = [1, 'default-domain']+data
    cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?)".format(my_table_name), item)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit() 

def deal_kernel_summary(logpath="suprof_event-108799.log"):
    my_table_name='my_table_kernel_summary'
    origin_view_name='view_kernel_summary'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    #['aggr_id', 'domain_name', 'total_gpu_time', 'total_count', 'using_tc_gpu_time', 'using_tc_count', 'memory_gpu_time', 'memory_count', 'other_gpu_time', 'other_count']
    # unit ns
    item = parse_kernel_summary(logpath)
    
    item = [1, 'default-domain'] + item
    
    cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?,?)".format(my_table_name), item)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()     

def deal_iter_all(logpath="suprof_event-108799.log"):
    my_table_name='my_table_iterations_all'
    origin_view_name='view_iterations_all'
    cur.execute('CREATE TABLE if not exists {} \
    as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
    cur.execute("DELETE FROM {}".format(my_table_name))
    # ['aggr_id', 'iter_value', 'start_time', 'stop_time', 'duration']
    # unit ns

    data_dict= parse_iteration_summary(logpath)

    for item in data_dict:
        iter_value = item
        start_time = data_dict[item][0]
        stop_time = data_dict[item][0]+data_dict[item][1]
        duration = data_dict[item][1]

        padding_column = [1,iter_value,start_time,stop_time,duration]
        cur.execute("INSERT INTO {} VALUES (?,?,?,?,?)".format(my_table_name), padding_column)

    cur.execute('DROP VIEW {}'.format(origin_view_name))
    cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
    con.commit()         
    print('sucess insert')

# def deal_iter_all(logpath="suprof_event-108799.log"):
#     my_table_name='my_table_aggregations'
#     origin_view_name='view_aggregations'
#     cur.execute('CREATE TABLE if not exists {} \
#     as SELECT * FROM  {}'.format(my_table_name,origin_view_name))
#     cur.execute("DELETE FROM {}".format(my_table_name))
#     #['aggr_id', 'iter_start', 'iter_stop', 'iter_aggregated', 'key_node_name', 'user_name', 'host_name', 'aggr_start', 'aggr_end']
#     # unit ns
#     padding_column = [1, 0, 0, 1, 'global_step', 'root', '09f7e89e5975', '2022-08-02 08:05:23', 0]
    
#     padding_column[2] = 2 
    
#     cur.execute("INSERT INTO {} VALUES (?,?,?,?,?,?,?,?,?)".format(my_table_name), padding_column)

#     cur.execute('DROP VIEW {}'.format(origin_view_name))
#     cur.execute('CREATE VIEW {} as select * from {}'.format(origin_view_name,my_table_name))
#     con.commit()         
#     print('sucess insert')

if __name__=='__main__':
    
    if len(sys.argv)==2:
        logpath=sys.argv[1]
    else:
        logpath = 'suprof_event-108799.log' 
    deal_gpu_utilization(logpath)
    deal_GPU_Utilizations(logpath)
    deal_viewop(logpath)
    deal_system_config(logpath)
    deal_performance_summary(logpath)

    deal_iteration_summary(logpath)
    deal_iteration_kernels(logpath)        
    deal_iteration_op(logpath)
    deal_iteration_op_kernels(logpath)

    deal_resource_usage_breakdown(logpath)
    deal_kernel_summary(logpath)
    deal_iter_all(logpath)
