package com.algotrace.engine.tracer;

import com.algotrace.engine.debug.MethodParameterExtractor;
import com.algotrace.engine.debug.VariableStateExtractor;
import com.algotrace.engine.model.EventType;
import com.algotrace.engine.model.ExecutionEvent;
import com.algotrace.engine.model.ExecutionTrace;
import com.sun.jdi.Method;
import com.sun.jdi.StackFrame;
import com.sun.jdi.Value;
import com.sun.jdi.event.MethodEntryEvent;
import com.sun.jdi.event.MethodExitEvent;
import com.sun.jdi.event.StepEvent;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class ExecutionTraceBuilder {

    private final AtomicLong nextEventId =
            new AtomicLong(1);

    private final CallStackTracker stackTracker =
            new CallStackTracker();

    private final ExecutionTrace trace =
            new ExecutionTrace();

    private final MethodParameterExtractor parameterExtractor =
            new MethodParameterExtractor();

    private final VariableStateExtractor variableStateExtractor =
            new VariableStateExtractor();

    public void onMethodEnter(MethodEntryEvent event) {

        Method method = event.method();

        Map<String, String> parameters =
                parameterExtractor.extract(event);

        CallContext context =
                stackTracker.enter(
                        method.name(),
                        parameters
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

                        .parameters(
                                context.getParameters()
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

    public void onLineExecuted(StepEvent event) {

        try {

            StackFrame frame =
                    event.thread().frame(0);

            Method method =
                    frame.location().method();

            CallContext context =
                    stackTracker.current();

            if (context == null) {
                return;
            }

            Map<String, String> variables =
                    variableStateExtractor.extract(frame);

            ExecutionEvent executionEvent =
                    ExecutionEvent.builder()

                            .eventId(
                                    nextEventId.getAndIncrement()
                            )

                            .timestamp(
                                    System.currentTimeMillis()
                            )

                            .eventType(
                                    EventType.LINE_EXECUTED
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

                            .parameters(
                                    context.getParameters()
                            )

                            .variables(
                                    variables
                            )

                            .returnValue(
                                    null
                            )

                            .build();

            trace.addEvent(executionEvent);

        } catch (Exception ignored) {
            /*
             * A frame may disappear when the method
             * is exiting. Ignore that single step.
             */
        }
    }

    public void onMethodExit(MethodExitEvent event) {

        Method method = event.method();

        CallContext context =
                stackTracker.exit();

        String returnValue =
                formatReturnValue(
                        event.returnValue()
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

                        .parameters(
                                context.getParameters()
                        )

                        .variables(
                                Collections.emptyMap()
                        )

                        .returnValue(
                                returnValue
                        )

                        .build();

        trace.addEvent(executionEvent);
    }

    private String formatReturnValue(Value value) {

        if (value == null) {
            return "void";
        }

        return value.toString();
    }

    public ExecutionTrace getTrace() {

        return trace;
    }
}