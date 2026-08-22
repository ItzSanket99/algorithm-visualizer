package com.algotrace.backend.execution;

import com.algotrace.engine.model.CallTreeNode;
import com.algotrace.engine.model.ExecutionEvent;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ExecutionData {

    private final List<ExecutionEvent> events;

    private final CallTreeNode callTree;
}