# BRDLProf

---

## Installation

To install BRDLProf on Linux or macOS:

```
$ wget http://br-artifactory.birentech.com:8082/artifactory/br_public/BRDLProf/brdlprof-1.0.0-py3-none-any.whl
$ pip install brdlprof-1.0.0-py3-none-any.whl 
```

---

## Profiling your own program

First of all, **dlprof** is the only command you need to use to profile your own `sulib` or `supa` based program. Before your first use in a brand new environment, we strongly recommend you to run:

```
$ dlprof test
```

To make sure everything is all right like below:

![](/material/suproftest.png)



The command asks for two args, the first one is your configuration which can be ignored if you want everything goes as default, the second one after tag `-exec` is your complete command to run your program which you want to profile. By the way, if the command you entered does not contain any configuration information, the `-exec` tag can also be omitted.

```
$ dlprof [YourConfiguration] -exec [YourProcessToTrace]
```

 The configuration info and key words are listed as:

- PERF_EXE=* 	//Set the real program name if you want to trace a shell or python script
- PERF_GROUP=0/1/2/3/4  //choose which group counter of spc module to dump
- PERF_FILTER=.* //enable all filters, include besu funtion
- PERF_FILTER=besu.* //trace besu funtions only, supa functions will be disabled
- PERF_CPTS=1 //print more timestamp information for kernel events
- PERF_HBMC=1 //enable hbmc counter dump
- PERF_NOC=1 //enable noc counter dump
- PERF_NOC_INTERVAL=** //Set the interval(millisecond) to do the next noc dump, default is 1s
- PERF_HA=1 //enable HA counter dump
- PERF_HA_INTERVAL=* //Set the interval(millisecond) to do the next HA dump, default is 1s
- PERF_DEBUG=0/1/2/3/4 //enable debug output(FATAL, ERROR, WARN, INFO, VERBOSE)
- PERF_OUTDIR=** //specify the profiling directory via this environment variable
- PERF_HOST_ONLY=1 //Trace host function only
- PERF_SUCCL=1 //Enable to trace SUCCL functions
- PERF_GRAPH=g/k/m //Set graph behavior in capture status: trace graph only(g), trace catpured kernel only(k), trace graph and kernel both(m).



Example:

```
$ dlprof PERF_OUTDIR=../supti_log/ PERF_EXE=python PERF_FILTER=besu.* -exec python -u test/br_test/test_yolov5m.py
```

The result will be several pairs of file as `.log` and `.raw` in your `PERF_OUTDIR`, if you don't have a `PERF_OUTDIR` pre-set, they will be generated in `/run/suprof/`.

---

## Running BRDLProfviewer

After you get your own result files, you can simply run the command as below to start the server:

```
$ dlprofviewer -b [BindingIPAddress] -p [BindingPort] -l [PathToYourLog]  
```

Then use your browser (chrome suggest) to open the address `http://BindingIPAddress:BindingPort/` and enjoy your profiling work.

![](/material/dlprofviewerscreenshot.png)

---

## Show Trace Timeline

We need a json file to show the trace timeline on a browser. You can use the command to get one:

```
$ chrome_convert [PathToYourLog]
```

The result json file will be generated in the same address as your log file.

You can click the `Tracing Trace log` button on the top-dashboard to jump to `perfetto` and open trace file of json. Then you can feel free to profile the timeline of your progress running on devices.



![](/material/timelinescreenshot.png)
