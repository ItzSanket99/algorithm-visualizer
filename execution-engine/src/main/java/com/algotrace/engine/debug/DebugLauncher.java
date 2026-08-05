package com.algotrace.engine.debug;

import com.algotrace.engine.util.WorkspaceManager;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;

import java.io.IOException;
import java.util.Map;

public class DebugLauncher {

    public DebugSession launch(String className) throws Exception {

        LaunchingConnector connector =
                Bootstrap.virtualMachineManager()
                        .defaultConnector();

        Map<String, Connector.Argument> arguments =
                connector.defaultArguments();

        /*
         * Main class to execute.
         */
        arguments
                .get("main")
                .setValue(className);

        /*
         * Classpath for compiled student classes.
         */
        String classPath =
                WorkspaceManager
                        .getClassDirectory()
                        .toAbsolutePath()
                        .toString();

        arguments
                .get("options")
                .setValue("-cp " + classPath);

        VirtualMachine virtualMachine =
                connector.launch(arguments);

        consumeOutput(virtualMachine.process());

        return new DebugSession(virtualMachine);

    }

    /**
     * Prevents the child JVM from blocking
     * because stdout/stderr buffers become full.
     */
    private void consumeOutput(Process process) {

        Thread outThread = new Thread(() -> {

            try {

                process
                        .getInputStream()
                        .transferTo(System.out);

            }

            catch (IOException ignored) {
            }

        });

        Thread errThread = new Thread(() -> {

            try {

                process
                        .getErrorStream()
                        .transferTo(System.err);

            }

            catch (IOException ignored) {
            }

        });

        outThread.setDaemon(true);
        errThread.setDaemon(true);

        outThread.start();
        errThread.start();

    }

}