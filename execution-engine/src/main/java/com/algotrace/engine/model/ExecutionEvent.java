package com.algotrace.engine.model;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.Map;

@Getter
@Builder
@ToString
public class ExecutionEvent {

    /*
     * Unique event id.
     */
    private final long eventId;

    /*
     * Time of event.
     */
    private final long timestamp;

    /*
     * Event category.
     */
    private final EventType eventType;

    /*
     * Function name.
     */
    private final String methodName;

    /*
     * Source line.
     */
    private final int lineNumber;

    /*
     * JVM Thread.
     */
    private final long threadId;

    /*
     * Unique invocation id.
     */
    private final long callId;

    /*
     * Parent invocation.
     */
    private final Long parentCallId;

    /*
     * Current recursion depth.
     */
    private final int callDepth;

    /*
     * Variables.
     */
    private final Map<String, String> variables;

    /*
     * Returned value.
     */
    private final String returnValue;

}