# !@file rest_endpoints.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

import json

from django.http import JsonResponse

from dlprof.endpoints.rest.aggregations_db import AggregationsDB
from dlprof.endpoints.rest.domains_db import DomainDB
from dlprof.endpoints.rest.domain_model_gpu_utilization_db import DomainModelGpuUtilizationDB
from dlprof.endpoints.rest.expert_systems_db import ExpertSystemsDB
from dlprof.endpoints.rest.gpu_info_db import GpuInfoDB
from dlprof.endpoints.rest.iterations_all_db import IterationsAllDB
from dlprof.endpoints.rest.iterations_profiled_db import IterationsProfiledDB
from dlprof.endpoints.rest.kernel_summary_db import KernelSummaryDB
from dlprof.endpoints.rest.longest_iter_duration_db import LongestIterDurationDB
from dlprof.endpoints.rest.resource_usage_breakdown_db import ResourceUsageBreakdownDB
from dlprof.endpoints.rest.performance_summary_db import PerformanceSummaryDB
from dlprof.endpoints.rest.system_config_db import SystemConfigDB
from dlprof.endpoints.rest.tc_utilization_db import TcUtilizationDB
from dlprof.endpoints.rest.device_gpu_utilizations_db import DeviceGpuUtilizationsDB
from dlprof.endpoints.rest.db_version_db import DbVersionDB
from dlprof.endpoints.rest.does_db_version_exist_db import DoesDbVersionExistDB
from dlprof.endpoints.rest.group_ops_db import GroupOpsDB

import dlprofviewer

def aggregation_data(request):
    obj = AggregationsDB(request.GET)
    return process_endpoint(obj)

def domain_data(request):
    obj = DomainDB(request.GET)
    return process_endpoint(obj)

def domain_model_gpu_utilization_percentage_panel(request):
    obj = DomainModelGpuUtilizationDB(request.GET)
    return process_endpoint(obj)

def expert_systems_panel(request):
    obj = ExpertSystemsDB(request.GET)
    return process_endpoint(obj)

def gpu_info_data(request):
    obj = GpuInfoDB(request.GET)
    return process_endpoint(obj)

def iterations_all_data(request):
    obj = IterationsAllDB(request.GET)
    return process_endpoint(obj)

def iterations_profiled_data(request):
    obj = IterationsProfiledDB(request.GET)
    return process_endpoint(obj)

def kernel_summary_panel(request):
    obj = KernelSummaryDB(request.GET)
    return process_endpoint(obj)

def longest_iter_duration_data(request):
    obj = LongestIterDurationDB(request.GET)
    return process_endpoint(obj)

def resource_usage_breakdown_panel(request):
    obj = ResourceUsageBreakdownDB(request.GET)
    return process_endpoint(obj)

def performance_summary_panel(request):
    obj = PerformanceSummaryDB(request.GET)
    return process_endpoint(obj)

def sysconfig_panel(request):
    obj = SystemConfigDB(request.GET)
    return process_endpoint(obj)

def tc_utilization_percentage_panel(request):
    obj = TcUtilizationDB(request.GET)
    return process_endpoint(obj)

def device_gpu_utilizations_data(request):
    obj = DeviceGpuUtilizationsDB(request.GET)
    return process_endpoint(obj)

def app_version(request):
    container_release_sting = ''
    # if hasattr(dlprofviewer, '__container_release__'):
    #     container_release_sting += f'{dlprofviewer.__container_release__}'

    dict = {
        'app_version': "1.8.0", 
        'container_release': container_release_sting}

    return JsonResponse(dict)

def db_version(request):
    obj = DbVersionDB(request.GET)
    return process_endpoint(obj)

def group_ops_treetable(request):
    obj = GroupOpsDB(request.GET)
    db = obj.get_result()
    json = obj.convert_db_to_json(db)
    response  = JsonResponse(json, status=200, safe=False)
    return response

def does_db_version_exist(request):
    obj = DoesDbVersionExistDB(request.GET)
    response = process_endpoint(obj)
    json_data = json.loads(response.content)
    dict = {'does_db_version_exist': json_data['rowcount'] == 1}
    return JsonResponse(dict)

def process_endpoint(obj):
    ret_code = 200      # "OK" (Standard response for successful HTTP request)

    try:
        result = obj.get_result()

    except FileNotFoundError as error:
        print(error)
        result = {}
        result["strerror"] = error.strerror
        result["errno"] = error.errno
        result["filename"] = error.filename
        result["db_not_found_error"] = True
        ret_code = 500

    response  = JsonResponse(result, status=ret_code, safe=False)
    return response


