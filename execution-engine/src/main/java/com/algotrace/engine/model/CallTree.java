package com.algotrace.engine.model;

import lombok.Getter;

@Getter
public class CallTree {

    private CallTreeNode root;

    public void setRoot(CallTreeNode root) {

        this.root = root;

    }

}