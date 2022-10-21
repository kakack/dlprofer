import os
import sys
import pathlib
import pkg_resources

def main():
    suprof_path = pkg_resources.resource_filename(
        'brdlprof', '')
    sys.path.append(suprof_path)
    sys.path.append(suprof_path + "/bin")
    exec_path = suprof_path + "/bin/suprof "
    os.system("chmod -R 777 " + suprof_path + "/bin")
    os.system("chmod -R 777 " + suprof_path + "/lib")
    cmd_line = exec_path
    
    if len(sys.argv) == 2 and sys.argv[1] == "test":
        cmd_line = cmd_line + suprof_path + "/bin/test_supti"
    else:
        args_cmd = ''
        for arg in sys.argv[1:]:
            args_cmd = args_cmd + "{} ".format(arg)
        args_cmd_ = args_cmd.split('-exec')
        if len(args_cmd_) == 1:
            cmd_line = cmd_line + " {}".format(args_cmd)
        elif len(args_cmd_) == 2:
            cmd_line = "{} {} {}".format(args_cmd_[0], cmd_line, args_cmd_[1])
        else:
            raise ValueError("Only one -exec tag is allowed!")
    # print(cmd_line)
    os.system(cmd_line)
    
if __name__ == '__main__':
    main()