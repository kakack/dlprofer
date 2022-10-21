# !@file command_endpoints.py
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

from dlprof.endpoints.commands.aggregate_cmd_db import AggregateCmdDB

def aggregate_cmd(request):
    cmd = AggregateCmdDB(request.POST)
    resp = cmd.do_command()
    mydict = resp[0]
    ret_code = resp[1]
    return JsonResponse(resp, safe=False)

