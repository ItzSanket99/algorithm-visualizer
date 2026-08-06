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
     * Event timestamp.
     */
    private final long timestamp;

    /*
     * Event type.
     */
    private final EventType eventType;

    /*
     * Method name.
     */
    private final String methodName;

    /*
     * Source line.
     */
    private final int lineNumber;

    /*
     * Thread id.
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
     * Recursion depth.
     */
    private final int callDepth;

    /*
     * Method parameters.
     */
    private final Map<String, String> parameters;

    /*
     * Local variables.
     */
    private final Map<String, String> variables;

    /*
     * Return value.
     */
    private final String returnValue;

}