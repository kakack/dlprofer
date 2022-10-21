# !@file views.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from django.shortcuts import render, redirect
from django.views.decorators.csrf import ensure_csrf_cookie
import json

def home(request):
    return redirect('dashboard')

def dlprof(request):
    return redirect('dashboard')

def index(request):
    return redirect('dashboard')

def dashboard(request):
    return render(
        request, 
        'dlprof/dashboard.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

def op_type_summary(request):
    return render(
        request, 
        'dlprof/op_type_summary.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

def ops_and_kernels(request):
    return render(
        request, 
        'dlprof/ops_and_kernels.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

def kernels_by_iteration(request):
    return render(
        request, 
        'dlprof/kernels_by_iteration.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

def kernels_by_op(request):
    return render(
        request, 
        'dlprof/kernels_by_op.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

@ensure_csrf_cookie
def iterations_view(request):
    return render(
        request, 
        'dlprof/iterations_view.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

def gpus_view(request):
    return render(
        request, 
        'dlprof/gpus_view.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})

def group_ops_view(request):
    return render(
        request, 
        'dlprof/group_ops_view.html', 
        {'aggrID': request.GET.get('aggrID'), 'domainName': request.GET.get('domainName')})