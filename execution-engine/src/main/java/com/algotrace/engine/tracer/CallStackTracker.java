package com.algotrace.engine.tracer;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class CallStackTracker {

    private final AtomicLong nextCallId =
            new AtomicLong(1);

    private final Deque<CallContext> stack =
            new ArrayDeque<>();

    public CallContext enter(
            String methodName,
            Map<String, String> parameters
    ) {

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

                        .methodName(
                                methodName
                        )

                        .depth(
                                stack.size()
                        )

                        .parameters(
                                parameters
                        )

                        .build();

        stack.push(context);

        return context;
    }

    public CallContext exit() {

        if (stack.isEmpty()) {
            return null;
        }

        return stack.pop();
    }

    public CallContext current() {

        return stack.peek();
    }

    public boolean isEmpty() {

        return stack.isEmpty();
    }

    public int currentDepth() {

        return stack.size();
    }
}