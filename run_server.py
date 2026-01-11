#!python

import subprocess
import sys

while True:
    print(f"{sys.executable} back\\p_graph\\main.py")
    subprocess.run(f"{sys.executable} back\\p_graph\\main.py")
    input("Press Enter to restart the server...\n")


