package com.algotrace.engine.debug;

import com.algotrace.engine.tracer.ExecutionTraceBuilder;
import com.sun.jdi.Method;
import com.sun.jdi.event.*;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.MethodEntryRequest;
import com.sun.jdi.request.MethodExitRequest;

public class MethodEventCollector {

    private final DebugSession session;

    public MethodEventCollector(DebugSession session) {
        this.session = session;
    }

    public void start() throws Exception {

        registerRequests();

        /*
         * Start executing the suspended target JVM.
         */
        session.getVirtualMachine().resume();

        EventQueue eventQueue = session.getEventQueue();

        boolean running = true;

        while (running) {

            EventSet eventSet = eventQueue.remove();

            for (Event event : eventSet) {

                if (event instanceof VMStartEvent) {

                    System.out.println("VM Started");

                }

                else if (event instanceof MethodEntryEvent entryEvent) {

                    builder.onMethodEnter(entryEvent);

                }

                else if (event instanceof MethodExitEvent exitEvent) {

                    builder.onMethodExit(exitEvent);;

                }

                else if (event instanceof VMDeathEvent) {

                    System.out.println("VM Died");
                    running = false;

                }

                else if (event instanceof VMDisconnectEvent) {

                    System.out.println("VM Disconnected");
                    running = false;

                }

            }

            /*
             * Continue execution.
             */
            eventSet.resume();

        }

        builder.getTrace()
                .getEvents()
                .forEach(System.out::println);

    }

    private void registerRequests() {

        EventRequestManager manager =
                session.getEventRequestManager();

        MethodEntryRequest entryRequest =
                manager.createMethodEntryRequest();

        /*
         * Ignore JDK internals.
         */
        entryRequest.addClassExclusionFilter("java.*");
        entryRequest.addClassExclusionFilter("jdk.*");
        entryRequest.addClassExclusionFilter("sun.*");

        entryRequest.setSuspendPolicy(
                EventRequest.SUSPEND_ALL
        );

        entryRequest.enable();

        MethodExitRequest exitRequest =
                manager.createMethodExitRequest();

        exitRequest.addClassExclusionFilter("java.*");
        exitRequest.addClassExclusionFilter("jdk.*");
        exitRequest.addClassExclusionFilter("sun.*");

        exitRequest.setSuspendPolicy(
                EventRequest.SUSPEND_ALL
        );

        exitRequest.enable();

    }

    ExecutionTraceBuilder builder =
            new ExecutionTraceBuilder();

    private void printMethodExit(MethodExitEvent event) {

        Method method = event.method();

        System.out.printf(
                "<< EXIT  : %s.%s()%n",
                method.declaringType().name(),
                method.name()
        );

    }

}