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

        System.out.println("[JDI] Starting debug session");
        System.out.println("[JDI] Target class: " + className);

        LaunchingConnector connector =
                Bootstrap.virtualMachineManager()
                        .defaultConnector();

        System.out.println(
                "[JDI] Connector: " + connector.name()
        );

        Map<String, Connector.Argument> arguments =
                connector.defaultArguments();

        /*
         * Main class to execute.
         */
        Connector.Argument mainArgument =
                arguments.get("main");

        if (mainArgument == null) {

            throw new IllegalStateException(
                    "JDI connector does not provide 'main' argument."
            );
        }

        mainArgument.setValue(className);

        /*
         * Classpath for compiled student classes.
         */
        String classPath =
                WorkspaceManager
                        .getClassDirectory()
                        .toAbsolutePath()
                        .toString();

        System.out.println(
                "[JDI] Classpath: " + classPath
        );

        /*
         * Configure target JVM options.
         */
        Connector.Argument optionsArgument =
                arguments.get("options");

        if (optionsArgument != null) {

            optionsArgument.setValue(
                    "-cp \"" + classPath + "\""
            );
        }

        System.out.println(
                "[JDI] Launching target JVM..."
        );

        VirtualMachine virtualMachine =
                connector.launch(arguments);

        System.out.println(
                "[JDI] Target JVM connected successfully."
        );

        /*
         * IMPORTANT:
         *
         * JDI requires the target JVM's stdout/stderr
         * to be consumed while it is running.
         */
        consumeOutput(
                virtualMachine.process()
        );

        return new DebugSession(
                virtualMachine
        );
    }

    /**
     * Continuously consume stdout/stderr of the
     * target JVM so its buffers cannot block execution.
     */
    private void consumeOutput(
            Process process
    ) {

        Thread outThread =
                new Thread(
                        () -> {

                            try {

                                process
                                        .getInputStream()
                                        .transferTo(
                                                System.out
                                        );

                            } catch (IOException ignored) {
                            }

                        },
                        "algotrace-jdi-stdout"
                );

        Thread errThread =
                new Thread(
                        () -> {

                            try {

                                process
                                        .getErrorStream()
                                        .transferTo(
                                                System.err
                                        );

                            } catch (IOException ignored) {
                            }

                        },
                        "algotrace-jdi-stderr"
                );

        outThread.setDaemon(true);
        errThread.setDaemon(true);

        outThread.start();
        errThread.start();
    }
}