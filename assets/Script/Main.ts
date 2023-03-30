const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    pointContainer: cc.Node = null;

    @property(cc.Node)
    pointNode: cc.Node = null;

    @property(cc.EditBox)
    xValue: cc.EditBox = null;

    @property(cc.EditBox)
    yValue: cc.EditBox = null;

    @property(cc.Label)
    tipLabel: cc.Label = null;

    @property(cc.Node)
    playBtnNode: cc.Node = null;

    private _pointWidth: number = 50;
    private _pointCount: number = 10;
    private _pointSpacing: number = 10;
    private _colorArr: cc.Color[] = [new cc.Color(255, 0, 0), new cc.Color(0, 255, 0), new cc.Color(0, 0, 255), new cc.Color(128, 0, 128), new cc.Color(128, 128, 0)];
    private _pointArr: cc.Node[][] = [];

    onLoad() {
        this.playBtnNode.on(cc.Node.EventType.TOUCH_START, this.onBtnTouchStart, this);
        this.playBtnNode.on(cc.Node.EventType.TOUCH_END, this.onBtnTouchEnd, this);
        this.playBtnNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onBtnTouchEnd, this);
    }

    onDestroy() {
        this.playBtnNode.off(cc.Node.EventType.TOUCH_START, this.onBtnTouchStart, this);
        this.playBtnNode.off(cc.Node.EventType.TOUCH_END, this.onBtnTouchEnd, this);
        this.playBtnNode.off(cc.Node.EventType.TOUCH_CANCEL, this.onBtnTouchEnd, this);
    }

    // Q1
    genBtnClick() {
        if (isNaN(Number(this.xValue.string)) || isNaN(Number(this.yValue.string))) {
            this.tipLabel.string = 'X和Y的值为数字';
            return;
        }
        if (this._pointArr.length == 0) {
            this.createPoint();
        } else {
            this.updatePointColor();
        }
    }

    private createPoint(): void {
        // 初始化container大小
        let containerWidth = this._pointWidth * this._pointCount + this._pointSpacing * (this._pointCount - 1);
        this.pointContainer.setContentSize(containerWidth, containerWidth);
        // 创建节点, x表示第几列，y表示第几行
        for (let y = 1; y <= this._pointCount; y++) {
            for (let x = 1; x <= this._pointCount; x++) {
                let point = cc.instantiate(this.pointNode);
                point.setContentSize(this._pointWidth, this._pointWidth);
                this.pointContainer.addChild(point);
                point.active = true;
                point.color = this.getPointColor(y, x);
                // 缓存所有point节点
                if (!this._pointArr[y]) {
                    this._pointArr[y] = [];
                }
                this._pointArr[y][x] = point;
            }
        }
    }

    /**
     * @param y ：某个点对应的纵向坐标
     * @param x ：某个点对应的横向坐标
     */
    private getPointColor(y: number, x: number): cc.Color {
        if (x == 1 && y == 1) {
            return this._colorArr[Math.floor(Math.random() * this._colorArr.length)];
        }
        let colorPercnetArr = this.calcColorPercent(y, x);
        let randomData = Math.random() * 100;
        let percentCur = 0;
        let colorIdx: number = -1;
        for (let i = 0; i < colorPercnetArr.length; i++) {
            if (randomData >= percentCur && randomData < percentCur + colorPercnetArr[i]) {
                // 随机的颜色在该区间
                colorIdx = i;
                break;
            }
            percentCur += colorPercnetArr[i];
        }

        return this._colorArr[colorIdx];
    }

    // 计算每种颜色的概率
    private calcColorPercent(y: number, x: number): number[] {
        let xPercent = Number(this.xValue.string);
        let yPercent = Number(this.yValue.string);
        // 基准概率
        let basePercent = 100 / this._colorArr.length;
        // 某中颜色对应的概率
        let percentArr: number[] = [0, 0, 0, 0, 0];
        // 已处理颜色的总概率
        let totalPercent: number = 0;
        // 已处理过的颜色个数
        let changedCount: number = 0;
        // 调整颜色概率
        if (x == 1) {
            // 第一列节点，只调整上方节点颜色概率
            let topColorIdx = this.getColorIndex(this._pointArr[y - 1][x].color);
            percentArr[topColorIdx] = basePercent + xPercent;
            totalPercent = percentArr[topColorIdx];
            changedCount++;
        } else if (y == 1) {
            // 第一行节点，只调整左侧节点颜色概率
            let leftColorIdx = this.getColorIndex(this._pointArr[y][x - 1].color);
            percentArr[leftColorIdx] = basePercent + xPercent;
            totalPercent = percentArr[leftColorIdx];
            changedCount++;
        } else {
            // 上方和左侧节点颜色概率都调整
            let leftColorIdx = this.getColorIndex(this._pointArr[y][x - 1].color);
            let topColorIdx = this.getColorIndex(this._pointArr[y - 1][x].color);
            if (leftColorIdx == topColorIdx) {
                // 左侧和上方颜色一样
                percentArr[leftColorIdx] = basePercent + yPercent;
                totalPercent = percentArr[leftColorIdx];
                changedCount++;
            } else {
                // 优先左侧节点颜色
                percentArr[leftColorIdx] = basePercent + xPercent;
                totalPercent = percentArr[leftColorIdx];
                changedCount++;
                if (totalPercent < 100) {
                    // 调整上方节点颜色概率
                    percentArr[topColorIdx] = basePercent + xPercent;
                    if (percentArr[topColorIdx] > 100 - totalPercent) {
                        // 总概率超过100%
                        percentArr[topColorIdx] = 100 - totalPercent;
                    }
                    totalPercent += percentArr[topColorIdx];
                    changedCount++;
                }
            }
        }

        if (totalPercent > 100) {
            totalPercent = 100;
        }
        let averagePercnet = (100 - totalPercent) / (this._colorArr.length - changedCount);
        for (let i = 0; i < percentArr.length; i++) {
            if (percentArr[i] == 0) {
                // 未调整的颜色概率设置为平均值
                percentArr[i] = averagePercnet;
            }
        }
        return percentArr;
    }

    // 获取某个颜色在自定义颜色中的索引
    private getColorIndex(color: cc.Color): number {
        for (let i = 0; i < this._colorArr.length; i++) {
            if (color.toHEX() == this._colorArr[i].toHEX()) {
                return i;
            }
        }
    }

    private updatePointColor(): void {
        for (let y = 1; y <= this._pointCount; y++) {
            for (let x = 1; x <= this._pointCount; x++) {
                this._pointArr[y][x].color = this.getPointColor(y, x);
            }
        }
    }

    // Q2
    /**
     * 传入两个数组，判断a数组中的某个值和b数组中的某个值相加是否等于compareValue
     * 设 m = array_1.length, n = array_2.length
     * 时间复杂度：O(mn)
     * @param array_1
     * @param array_2
     * @param compareValue
     */
    private sumIsEqual(array_1: number[], array_2: number[], compareValue: number): boolean {
        for (let i = 0; i < array_1.length; i++) {
            let value = compareValue - array_1[i];
            if (array_2.indexOf(value) != -1) {
                return true;
            }
        }

        return false;
    }

    // Q3
    private showPlayBtn(): void {
        this.playBtnNode.active = true;
        this.playBtnNode.scale = 0;
        let showAnimation = this.playBtnNode.getComponent(cc.Animation);
        showAnimation.on('finished', this.playBtnIdleAni, this);
        showAnimation.play('showAni');
    }

    private playBtnIdleAni(): void {
        setTimeout(function () {
            this.playBtnNode.getComponent(cc.Animation).play('idleAni');
        }.bind(this), 200)
        this.playBtnNode.getComponent(cc.Animation).off('finished', this.playBtnIdleAni, this);
    }

    private onBtnTouchStart(): void {
        this.playBtnNode.getComponent(cc.Animation).stop('idleAni');
        cc.tween(this.playBtnNode)
            .to(0.12, { scale: 0.85 })
            .to(0.1, { scale: 0.95 })
            .to(0.08, { scale: 0.85 })
            .to(0.08, { scale: 0.9 })
            .to(0.05, { scale: 0.85 })
            .to(0.05, { scale: 0.9 })
            .to(0.03, { scale: 0.85 })
            .start();
    }

    private onBtnTouchEnd(): void {
        cc.tween(this.playBtnNode)
            .to(0.15, { scale: 1.2 })
            .to(0.1, { scale: 1 })
            .to(0.08, { scale: 1.1 })
            .to(0.08, { scale: 1 })
            .to(0.05, { scale: 1.05 })
            .to(0.03, { scale: 1 })
            .start();
    }
}
