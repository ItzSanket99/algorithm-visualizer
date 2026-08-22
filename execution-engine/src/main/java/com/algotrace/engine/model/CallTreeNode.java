package com.algotrace.engine.model;

import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Getter
public class CallTreeNode {

    private final long callId;

    private final Long parentCallId;

    private final String methodName;

    private final int depth;

    private final Map<String, String> parameters;

    private final List<CallTreeNode> children =
            new ArrayList<>();

    private String returnValue;

    public CallTreeNode(
            long callId,
            Long parentCallId,
            String methodName,
            int depth,
            Map<String, String> parameters
    ) {

        this.callId = callId;

        this.parentCallId =
                parentCallId;

        this.methodName =
                methodName;

        this.depth =
                depth;

        this.parameters =
                parameters;
    }

    public void addChild(
            CallTreeNode child
    ) {

        children.add(child);
    }

    public void setReturnValue(
            String returnValue
    ) {

        this.returnValue =
                returnValue;
    }

    public List<CallTreeNode> getChildren() {

        return Collections.unmodifiableList(
                children
        );
    }
}