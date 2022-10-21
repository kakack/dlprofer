# !@file urls.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from django.urls import path
from django.conf.urls import url
from . import views, rest_endpoints, datatables_endpoints, command_endpoints
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = [
    # Views
    #
    path('', views.home, name="home"),
    path('dashboard.html', views.dashboard, name="dashboard"),
    path('index.html', views.index, name="index"),
    path('dlprof.html', views.dlprof, name="dlprof"),
    path('op_type_summary.html', views.op_type_summary, name="op_type_summary"),
    path('ops_and_kernels.html', views.ops_and_kernels, name="ops_and_kernels"),
    path('kernels_by_iteration.html', views.kernels_by_iteration, name="kernels_by_iteration"),
    path('kernels_by_op.html', views.kernels_by_op, name="kernels_by_op"),
    path('iterations_view.html', views.iterations_view, name="iterations_view"),
    path('gpus_view.html', views.gpus_view, name="gpus_view"),
    path('group_ops_view.html', views.group_ops_view, name="group_ops_view"),

    # REST Endpoints
    #
    url('dlprof/rest/aggregation_data', rest_endpoints.aggregation_data),
    url('dlprof/rest/domain_data', rest_endpoints.domain_data),
    url('dlprof/rest/domain_model_gpu_utilization_percentage_panel', rest_endpoints.domain_model_gpu_utilization_percentage_panel),
    url('dlprof/rest/expert_systems_panel', rest_endpoints.expert_systems_panel),
    url('dlprof/rest/gpu_info_data', rest_endpoints.gpu_info_data),
    url('dlprof/rest/iterations_all_data', rest_endpoints.iterations_all_data),
    url('dlprof/rest/iterations_profiled_data', rest_endpoints.iterations_profiled_data),
    url('dlprof/rest/kernel_summary_panel', rest_endpoints.kernel_summary_panel),
    url('dlprof/rest/longest_iter_duration_data', rest_endpoints.longest_iter_duration_data),
    url('dlprof/rest/resource_usage_breakdown_panel', rest_endpoints.resource_usage_breakdown_panel),
    url('dlprof/rest/performance_summary_panel', rest_endpoints.performance_summary_panel),
    url('dlprof/rest/sysconfig_panel', rest_endpoints.sysconfig_panel),
    url('dlprof/rest/tc_utilization_percentage_panel', rest_endpoints.tc_utilization_percentage_panel),
    url('dlprof/rest/device_gpu_utilizations_data', rest_endpoints.device_gpu_utilizations_data),
    url('dlprof/rest/app_version', rest_endpoints.app_version),
    url('dlprof/rest/db_version', rest_endpoints.db_version),
    url('dlprof/rest/does_db_version_exist', rest_endpoints.does_db_version_exist),
    url('dlprof/rest/group_ops_treetable', rest_endpoints.group_ops_treetable),
    

    # Datatables Endpoints
    #
    url('dlprof/datatable/iteration_kernels_datatable', datatables_endpoints.iteration_kernels_datatable),
    url('dlprof/datatable/iteration_op_kernels_datatable', datatables_endpoints.iteration_op_kernels_datatable),
    url('dlprof/datatable/iteration_ops_datatable', datatables_endpoints.iteration_ops_datatable),
    url('dlprof/datatable/iteration_summary_datatable', datatables_endpoints.iteration_summary_datatable),
    url('dlprof/datatable/kernel_summaries_datatable', datatables_endpoints.kernel_summaries_datatable),
    url('dlprof/datatable/op_type_summary_datatable', datatables_endpoints.op_type_summary_datatable),
    url('dlprof/datatable/ops_datatable', datatables_endpoints.ops_datatable),
    url('dlprof/datatable/top10gpu_datatable', datatables_endpoints.top10gpu_datatable),

    # Command Endpoints
    #
    url('dlprof/command/aggregate_cmd', command_endpoints.aggregate_cmd),
    
]

urlpatterns += staticfiles_urlpatterns()
