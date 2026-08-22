package com.algotrace.engine.debug;

import com.algotrace.engine.model.ExecutionTrace;
import com.algotrace.engine.tracer.ExecutionTraceBuilder;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventQueue;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.MethodEntryEvent;
import com.sun.jdi.event.MethodExitEvent;
import com.sun.jdi.event.StepEvent;
import com.sun.jdi.event.VMDeathEvent;
import com.sun.jdi.event.VMDisconnectEvent;
import com.sun.jdi.event.VMStartEvent;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.MethodEntryRequest;
import com.sun.jdi.request.MethodExitRequest;
import com.sun.jdi.request.StepRequest;

import java.util.HashMap;
import java.util.Map;

public class MethodEventCollector {

    private final DebugSession session;

    private final ExecutionTraceBuilder traceBuilder =
            new ExecutionTraceBuilder();

    private final Map<Long, StepRequest> stepRequests =
            new HashMap<>();

    public MethodEventCollector(DebugSession session) {
        this.session = session;
    }

    public void start() throws Exception {

        registerMethodRequests();

        /*
         * Start the target JVM.
         */
        session.getVirtualMachine().resume();

        EventQueue eventQueue =
                session.getEventQueue();

        boolean running = true;

        while (running) {

            EventSet eventSet =
                    eventQueue.remove();

            for (Event event : eventSet) {

                if (event instanceof VMStartEvent) {

                    System.out.println("VM Started");
                }

                else if (event instanceof MethodEntryEvent entryEvent) {

                    createStepRequest(
                            entryEvent.thread()
                    );

                    traceBuilder.onMethodEnter(
                            entryEvent
                    );
                }

                else if (event instanceof StepEvent stepEvent) {

                    traceBuilder.onLineExecuted(
                            stepEvent
                    );
                }

                else if (event instanceof MethodExitEvent exitEvent) {

                    traceBuilder.onMethodExit(
                            exitEvent
                    );

                    /*
                     * IMPORTANT:
                     *
                     * We do NOT remove the StepRequest here.
                     *
                     * The same thread can still be executing
                     * its parent method after a recursive method
                     * returns.
                     */
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
             * Resume the target JVM after processing
             * the current suspended event set.
             */
            eventSet.resume();
        }
    }

    private void registerMethodRequests() {

        EventRequestManager manager =
                session.getEventRequestManager();

        /*
         * METHOD ENTRY
         */
        MethodEntryRequest entryRequest =
                manager.createMethodEntryRequest();

        entryRequest.addClassExclusionFilter(
                "java.*"
        );

        entryRequest.addClassExclusionFilter(
                "jdk.*"
        );

        entryRequest.addClassExclusionFilter(
                "sun.*"
        );

        entryRequest.setSuspendPolicy(
                EventRequest.SUSPEND_ALL
        );

        entryRequest.enable();

        /*
         * METHOD EXIT
         */
        MethodExitRequest exitRequest =
                manager.createMethodExitRequest();

        exitRequest.addClassExclusionFilter(
                "java.*"
        );

        exitRequest.addClassExclusionFilter(
                "jdk.*"
        );

        exitRequest.addClassExclusionFilter(
                "sun.*"
        );

        exitRequest.setSuspendPolicy(
                EventRequest.SUSPEND_ALL
        );

        exitRequest.enable();
    }

    private void createStepRequest(
            ThreadReference thread
    ) {

        long threadId =
                thread.uniqueID();

        /*
         * Don't create another StepRequest if this
         * thread already has one.
         */
        if (stepRequests.containsKey(threadId)) {
            return;
        }

        EventRequestManager manager =
                session.getEventRequestManager();

        StepRequest stepRequest =
                manager.createStepRequest(
                        thread,
                        StepRequest.STEP_LINE,
                        StepRequest.STEP_INTO
                );

        /*
         * Ignore JDK/framework internals.
         */
        stepRequest.addClassExclusionFilter(
                "java.*"
        );

        stepRequest.addClassExclusionFilter(
                "jdk.*"
        );

        stepRequest.addClassExclusionFilter(
                "sun.*"
        );

        stepRequest.setSuspendPolicy(
                EventRequest.SUSPEND_ALL
        );

        stepRequests.put(
                threadId,
                stepRequest
        );

        stepRequest.enable();
    }

    public ExecutionTrace getExecutionTrace() {

        return traceBuilder.getTrace();
    }
}