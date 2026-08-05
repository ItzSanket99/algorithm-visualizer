package com.algotrace.engine.tracer;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.atomic.AtomicLong;

public class CallStackTracker {

    private final AtomicLong nextCallId =
            new AtomicLong(1);

    private final Deque<CallContext> stack =
            new ArrayDeque<>();

    /**
     * Push new function invocation.
     */
    public CallContext enter(String methodName) {

        CallContext parent =
                stack.peek();

        CallContext context =
                CallContext.builder()

                        .callId(
                                nextCallId.getAndIncrement()
                        )

                        .parentCallId(
                                parent == null
                                        ? null
                                        : parent.getCallId()
                        )

                        .methodName(methodName)

                        .depth(stack.size())

                        .build();

        stack.push(context);

        return context;

    }

    /**
     * Exit current invocation.
     */
    public CallContext exit() {

        return stack.pop();

    }

    public boolean isEmpty() {

        return stack.isEmpty();

    }

    public int currentDepth() {

        return stack.size();

    }

}