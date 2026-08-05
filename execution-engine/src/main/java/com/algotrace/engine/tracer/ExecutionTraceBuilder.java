package com.algotrace.engine.tracer;

import com.algotrace.engine.model.EventType;
import com.algotrace.engine.model.ExecutionEvent;
import com.algotrace.engine.model.ExecutionTrace;
import com.sun.jdi.Method;
import com.sun.jdi.event.MethodEntryEvent;
import com.sun.jdi.event.MethodExitEvent;

import java.util.Collections;
import java.util.concurrent.atomic.AtomicLong;

public class ExecutionTraceBuilder {

    private final AtomicLong nextEventId =
            new AtomicLong(1);

    private final CallStackTracker stackTracker =
            new CallStackTracker();

    private final ExecutionTrace trace =
            new ExecutionTrace();

    public void onMethodEnter(MethodEntryEvent event) {

        Method method =
                event.method();

        CallContext context =
                stackTracker.enter(
                        method.name()
                );

        ExecutionEvent executionEvent =
                ExecutionEvent.builder()

                        .eventId(
                                nextEventId.getAndIncrement()
                        )

                        .timestamp(
                                System.currentTimeMillis()
                        )

                        .eventType(
                                EventType.METHOD_ENTER
                        )

                        .methodName(
                                method.name()
                        )

                        .lineNumber(
                                event.location().lineNumber()
                        )

                        .threadId(
                                event.thread().uniqueID()
                        )

                        .callId(
                                context.getCallId()
                        )

                        .parentCallId(
                                context.getParentCallId()
                        )

                        .callDepth(
                                context.getDepth()
                        )

                        .variables(
                                Collections.emptyMap()
                        )

                        .returnValue(
                                null
                        )

                        .build();

        trace.addEvent(executionEvent);

    }

    public void onMethodExit(MethodExitEvent event) {

        Method method =
                event.method();

        CallContext context =
                stackTracker.exit();

        ExecutionEvent executionEvent =
                ExecutionEvent.builder()

                        .eventId(
                                nextEventId.getAndIncrement()
                        )

                        .timestamp(
                                System.currentTimeMillis()
                        )

                        .eventType(
                                EventType.METHOD_EXIT
                        )

                        .methodName(
                                method.name()
                        )

                        .lineNumber(
                                event.location().lineNumber()
                        )

                        .threadId(
                                event.thread().uniqueID()
                        )

                        .callId(
                                context.getCallId()
                        )

                        .parentCallId(
                                context.getParentCallId()
                        )

                        .callDepth(
                                context.getDepth()
                        )

                        .variables(
                                Collections.emptyMap()
                        )

                        .returnValue(
                                null
                        )

                        .build();

        trace.addEvent(executionEvent);

    }

    public ExecutionTrace getTrace() {

        return trace;

    }

}