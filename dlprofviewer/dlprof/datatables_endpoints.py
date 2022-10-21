# !@file datatables_endpoints.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from django.http import JsonResponse

from dlprof.endpoints.datatables.iteration_kernels_db import IterationKernelsDB
from dlprof.endpoints.datatables.iteration_op_kernels_db import IterationOpKernelsDB
from dlprof.endpoints.datatables.iteration_ops_db import IterationOpsDB
from dlprof.endpoints.datatables.iteration_summary_db import IterationSummaryDB
from dlprof.endpoints.datatables.kernel_summaries_db import KernelSummariesDB
from dlprof.endpoints.datatables.op_type_summary_db import OpTypeSummaryDB
from dlprof.endpoints.datatables.ops_db import OpsDB
from dlprof.endpoints.datatables.top_ten_gpu_ops_db import TopTenGpuOpsDB


def iteration_kernels_datatable(request):
    return JsonResponse(IterationKernelsDB(request.GET).get_result())

def iteration_op_kernels_datatable(request):
    return JsonResponse(IterationOpKernelsDB(request.GET).get_result())

def iteration_ops_datatable(request):
    return JsonResponse(IterationOpsDB(request.GET).get_result())

def iteration_summary_datatable(request):
    return JsonResponse(IterationSummaryDB(request.GET).get_result())

def kernel_summaries_datatable(request):
    return JsonResponse(KernelSummariesDB(request.GET).get_result())

def op_type_summary_datatable(request):
    return JsonResponse(OpTypeSummaryDB(request.GET).get_result())

def ops_datatable(request):
    return JsonResponse(OpsDB(request.GET).get_result())

def top10gpu_datatable(request):
    return JsonResponse(TopTenGpuOpsDB(request.GET).get_result())


