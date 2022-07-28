/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.source = `
var nextID: number = 0;
@Observed
class Model {
  text : string = '';
  color: string = '#00ff00';
  constructor(t: string, c: string) {
    this.text = t;
    this.color = c;
  }
}

@Component
struct CustomText {
  @ObjectLink model: Model;
  build() {
    Row() {
      Text(this.model.text)
    }
  }
}

@Entry
@Component
struct Parent {
  nextId: number = 1;
  @State models : Model[] = [ new Model('0', '#ffffff'), new Model('1', '#fff456') ];
  build() {
    Column() {
      ForEach (this.models, (item) => {
          CustomText({model: item})
        },
        (item) => item.text
      )
    }
  }
}
`
exports.expectResult =
`var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var nextID = 0;
let Model = class Model {
    constructor(t, c) {
        this.text = '';
        this.color = '#00ff00';
        this.text = t;
        this.color = c;
    }
};
Model = __decorate([
    Observed
], Model);
class CustomText extends View {
    constructor(parent, params) {
        super(parent);
        this.__model = new SynchedPropertyNesedObject(params.model, this, "model");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        this.__model.set(params.model);
    }
    setStateSourcePropertiesUnchanged() {
    }
    setOneWaySyncPropertiesUnchanged() {
    }
    setTwoWaySyncPropertiesUnchanged() {
        this.__model.SetPropertyUnchanged();
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__model.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__model.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get model() {
        return this.__model.get();
    }
    render() {
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(this.model.text);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.__model.markDependentElementsDirty(this);
        this.updateDirtyElements();
    }
}
class Parent extends View {
    constructor(parent, params) {
        super(parent);
        this.nextId = 1;
        this.__models = new ObservedPropertyObject([new Model('0', '#ffffff'), new Model('1', '#fff456')], this, "models");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.nextId !== undefined) {
            this.nextId = params.nextId;
        }
        if (params.models !== undefined) {
            this.models = params.models;
        }
    }
    setStateSourcePropertiesUnchanged() {
        this.__models.SetPropertyUnchanged();
    }
    setOneWaySyncPropertiesUnchanged() {
    }
    setTwoWaySyncPropertiesUnchanged() {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__models.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.nextId = undefined;
        this.__models.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get models() {
        return this.__models.get();
    }
    set models(newValue) {
        this.__models.set(newValue);
    }
    render() {
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                let earlierCreatedChild_2 = this.findChildById("2");
                if (earlierCreatedChild_2 == undefined) {
                    View.create(new CustomText("2", this, { model: item }));
                }
                else {
                    earlierCreatedChild_2.updateWithValueParams({
                        model: item
                    });
                    View.create(earlierCreatedChild_2);
                }
            };
            const forEachItemIdFunc = item => item.text;
            this.forEachUpdateFunction(elmtId, this.models, forEachItemIdFunc, forEachItemGenFunction);
            if (!isInitialRender) {
                ForEach.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.__models.markDependentElementsDirty(this);
        this.updateDirtyElements();
    }
}
loadDocument(new Parent("1", undefined, {}));
`